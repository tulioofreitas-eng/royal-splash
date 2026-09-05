import { expect, test } from "@playwright/test";

const FIRST_TOUCH_KEY = "royal_growth_first_touch.v1";

async function fillValidProjectForm(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.locator("#project-name").fill("Pessoa Growth");
  await page.locator("#project-type").selectOption("residencial");
  await page.locator("#project-city").fill("Rio de Janeiro");
  await page.locator("#project-scale").fill("Piscina e deck");
  await page.locator("#project-question").fill("Avaliar implantação");
  await page.locator("#project-email").fill("growth@example.com");
  await page.locator("#project-consent").check();
}

test("First Touch stays ephemeral until valid consented submission", async ({
  page,
}) => {
  let submittedBody: Record<string, unknown> | undefined;
  await page.route("**/api/site-lead", async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        caseId: "case-growth-001",
        replay: false,
      }),
    });
  });

  await page.goto(
    "/inicie-seu-projeto?utm_campaign=launch.01&utm_medium=paid_search&utm_source=google&source=site_header&pageRef=%2Fsobre",
  );

  expect(
    await page.evaluate((key) => localStorage.getItem(key), FIRST_TOUCH_KEY),
  ).toBeNull();

  await fillValidProjectForm(page);

  expect(
    await page.evaluate((key) => localStorage.getItem(key), FIRST_TOUCH_KEY),
  ).toBeNull();

  await page.getByRole("button", {
    name: "Enviar contexto do projeto",
  }).click();

  await expect(page.locator("[data-whatsapp-fallback]")).toBeVisible();

  const persisted = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    FIRST_TOUCH_KEY,
  );
  expect(persisted.version).toBe(1);
  expect(persisted.firstTouch).toMatchObject({
    campaignRef: "launch.01",
    medium: "paid_search",
    source: "google",
    landingPageRef: "/inicie-seu-projeto",
  });
  expect(Object.keys(persisted.firstTouch).sort()).toEqual([
    "campaignRef",
    "capturedAt",
    "landingPageRef",
    "medium",
    "source",
  ]);

  const attribution = submittedBody?.attribution as {
    firstTouch: Record<string, unknown>;
    submissionTouch: Record<string, unknown>;
  };
  expect(attribution.firstTouch).toEqual(persisted.firstTouch);
  expect(attribution.submissionTouch).toEqual({
    campaignRef: "launch.01",
    medium: "paid_search",
    source: "google",
    pageRef: "/inicie-seu-projeto",
  });
  expect(JSON.stringify(persisted)).not.toContain("Pessoa Growth");
  expect(JSON.stringify(persisted)).not.toContain("growth@example.com");
  expect(JSON.stringify(persisted)).not.toContain("Rio de Janeiro");
  expect(JSON.stringify(persisted)).not.toContain("case-growth-001");
});

test("Atlas failure preserves composed WhatsApp and unchanged retry reference", async ({
  page,
}) => {
  const submissionRefs: string[] = [];
  let calls = 0;
  await page.route("**/api/site-lead", async (route) => {
    calls += 1;
    const body = route.request().postDataJSON();
    submissionRefs.push(body.submissionRef);

    if (calls === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "temporarily_unavailable" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        caseId: "case-growth-replay",
        replay: true,
      }),
    });
  });

  await page.goto("/inicie-seu-projeto");
  await fillValidProjectForm(page);

  const submit = page.getByRole("button", {
    name: "Enviar contexto do projeto",
  });
  await submit.click();

  await expect(page.locator("[data-error-summary]")).toBeVisible();
  await expect(page.locator("[data-project-start-form]")).toBeVisible();
  await expect(page.locator("[data-whatsapp-fallback]")).toBeHidden();

  const whatsappHref = await page
    .locator("[data-persistent-whatsapp]")
    .getAttribute("href");
  expect(whatsappHref).toContain("https://wa.me/5521982590643?text=");
  expect(decodeURIComponent(whatsappHref ?? "")).toContain("Pessoa Growth");
  expect(decodeURIComponent(whatsappHref ?? "")).toContain("Piscina e deck");

  await submit.click();
  await expect(page.locator("[data-whatsapp-fallback]")).toBeVisible();

  expect(submissionRefs).toHaveLength(2);
  expect(submissionRefs[1]).toBe(submissionRefs[0]);
});

for (const [label, response] of [
  ["mock", { ok: true, mock: true }],
  ["missing caseId", { ok: true, replay: false }],
  ["malformed caseId", { ok: true, caseId: "case/id", replay: false }],
]) {
  test(`${label} response does not claim Intake capture`, async ({ page }) => {
    await page.route("**/api/site-lead", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      }),
    );
    await page.goto("/inicie-seu-projeto");
    await fillValidProjectForm(page);
    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    await expect(page.locator("[data-error-summary]")).toBeVisible();
    await expect(page.locator("[data-project-start-form]")).toBeVisible();
    await expect(page.locator("[data-whatsapp-fallback]")).toBeHidden();
  });
}

test("browser deadline does not claim a late Atlas success", async ({
  page,
}) => {
  await page.route("**/api/site-lead", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        caseId: "case-too-late",
        replay: false,
      }),
    }).catch(() => {});
  });

  await page.goto("/inicie-seu-projeto");
  await fillValidProjectForm(page);
  const startedAt = Date.now();
  await page.getByRole("button", {
    name: "Enviar contexto do projeto",
  }).click();

  await expect(page.locator("[data-error-summary]")).toBeVisible({
    timeout: 10_000,
  });
  expect(Date.now() - startedAt).toBeLessThan(11_000);
  await expect(page.locator("[data-project-start-form]")).toBeVisible();
  await expect(page.locator("[data-whatsapp-fallback]")).toBeHidden();
  await expect(page.locator("[data-persistent-whatsapp]")).toHaveAttribute(
    "href",
    /\?text=/,
  );
});

test("browser network failure keeps composed WhatsApp available", async ({
  page,
}) => {
  await page.route("**/api/site-lead", (route) => route.abort("failed"));
  await page.goto("/inicie-seu-projeto");
  await fillValidProjectForm(page);
  await page.getByRole("button", {
    name: "Enviar contexto do projeto",
  }).click();

  await expect(page.locator("[data-error-summary]")).toBeVisible();
  await expect(page.locator("[data-project-start-form]")).toBeVisible();
  await expect(page.locator("[data-persistent-whatsapp]")).toHaveAttribute(
    "href",
    /\?text=/,
  );
});

test("anonymous WhatsApp click is analytics-only", async ({ page }) => {
  let clickAnalytics = 0;
  let intakeRequests = 0;
  await page.route("**/api/whatsapp-click", (route) => {
    clickAnalytics += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, mock: true }),
    });
  });
  page.on("request", (request) => {
    if (request.url().includes("/api/site-lead")) intakeRequests += 1;
  });

  await page.goto("/sobre");
  await page.getByRole("link", {
    name: "Conversar no WhatsApp",
    exact: true,
  }).click();

  await expect.poll(() => clickAnalytics).toBe(1);
  expect(intakeRequests).toBe(0);

  const events = await page.evaluate(
    () =>
      (window as Window & { __siteAnalyticsEvents?: unknown[] })
        .__siteAnalyticsEvents ?? [],
  );
  expect(JSON.stringify(events)).not.toContain("lead_submitted");
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`nonvisual wiring preserves layout at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/inicie-seu-projeto");

    const evidence = await page.evaluate(() => ({
      horizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      runtimeElements: document.querySelectorAll(
        "[data-growth-attribution], [data-whatsapp-click-analytics]",
      ).length,
      formVisible: Boolean(
        document.querySelector("[data-project-start-form]")?.getClientRects()
          .length,
      ),
    }));

    expect(evidence).toEqual({
      horizontalOverflow: false,
      runtimeElements: 0,
      formVisible: true,
    });
  });
}

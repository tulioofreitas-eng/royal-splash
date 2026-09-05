import {
  expect,
  test,
} from "@playwright/test";

interface SemanticEvent {
  schemaVersion: string;
  eventName: string;
  context: {
    pageRef: string;
    route?: string;
    templateRef?: string;
    componentRef?: string;
  };
  subjectRef?: string;
  channelRef?: string;
}

async function readEvents(
  page: import("@playwright/test").Page,
): Promise<SemanticEvent[]> {
  return page.evaluate(() => {
    const analyticsWindow =
      window as Window & {
        __siteAnalyticsEvents?: unknown[];
      };

    return (
      analyticsWindow.__siteAnalyticsEvents ??
      []
    );
  }) as Promise<SemanticEvent[]>;
}

test.describe(
  "provider-independent semantic analytics runtime",
  () => {
    test("records a semantic page_viewed event", async ({
      page,
    }) => {
      await page.goto("/");

      const events =
        await readEvents(page);

      expect(events).toEqual([
        {
          schemaVersion:
            "site-analytics.v1",
          eventName:
            "page_viewed",
          context: {
            pageRef: "/",
            route: "/",
            templateRef: "site",
          },
        },
      ]);
    });

    test("records Home qualified CTA activation without provider delivery", async ({
      page,
    }) => {
      await page.goto("/");

      await page.evaluate(() => {
        document.addEventListener(
          "click",
          (event) => {
            if (
              event.target instanceof Element &&
              event.target.closest(
                "[data-analytics-cta]",
              )
            ) {
              event.preventDefault();
            }
          },
          {
            capture: true,
            once: true,
          },
        );
      });

      await page
        .getByRole("main")
        .getByRole("link", {
          name: "Fale com a Royal",
          exact: true,
        })
        .click();

      const events =
        await readEvents(page);

      expect(events.at(-1)).toEqual({
        schemaVersion:
          "site-analytics.v1",
        eventName:
          "cta_activated",
        context: {
          pageRef: "/",
          route: "/",
          templateRef: "site",
          componentRef:
            "home_final_project_form",
        },
        subjectRef:
          "project_start",
        channelRef:
          "site_form",
      });
    });

    test("records the rerouted SiteHeader CTA with the Royal site_contact channel", async ({
      page,
    }) => {
      await page.goto("/sobre");

      await page.evaluate(() => {
        document.addEventListener(
          "click",
          (event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("[data-analytics-cta]")
            ) {
              event.preventDefault();
            }
          },
          { capture: true, once: true },
        );
      });

      await page
        .getByRole("navigation", { name: "Navegação principal" })
        .getByRole("link", { name: "Inicie seu projeto", exact: true })
        .click();

      const events = await readEvents(page);

      expect(events.at(-1)).toEqual({
        schemaVersion: "site-analytics.v1",
        eventName: "cta_activated",
        context: {
          pageRef: "/sobre",
          route: "/sobre",
          templateRef: "site",
          componentRef: "site_header",
        },
        subjectRef: "project_start",
        channelRef: "site_contact",
      });
    });

    test("records segment CTA activation with semantic context only", async ({
      page,
    }) => {
      await page.goto("/servicos");

      await page.evaluate(() => {
        document.addEventListener(
          "click",
          (event) => {
            if (
              event.target instanceof Element &&
              event.target.closest(
                "[data-analytics-cta]",
              )
            ) {
              event.preventDefault();
            }
          },
          {
            capture: true,
            once: true,
          },
        );
      });

      await page
        .getByRole("link", {
          name:
            "WhatsApp para projeto Residencial",
        })
        .first()
        .click();

      const events =
        await readEvents(page);

      expect(events.at(-1)).toEqual({
        schemaVersion:
          "site-analytics.v1",
        eventName:
          "cta_activated",
        context: {
          pageRef:
            "/servicos",
          route:
            "/servicos",
          templateRef:
            "site",
          componentRef:
            "residencial_whatsapp",
        },
        subjectRef:
          "project_start",
        channelRef:
          "whatsapp",
      });
    });

    async function fillValidProjectStartForm(page: import("@playwright/test").Page): Promise<void> {
      await page.locator("#project-name").fill("Pessoa Analytics");
      await page.locator("#project-type").selectOption("residencial");
      await page.locator("#project-city").fill("Cidade Analytics");
      await page.locator("#project-question").fill(
        "Conteúdo sensível de teste que não pode entrar em analytics.",
      );
      await page.locator("#project-email").fill("analytics@example.com");
      await page.locator("#project-phone").fill("11987654321");
      await page.locator("#project-consent").check();
    }

    test("records lead_submitted after successful mock ingress without PII, exactly once, with WhatsApp continuation and no duplicate Atlas submission", async ({
      page,
    }) => {
      const siteLeadRequests: string[] = [];
      await page.route("**/api/site-lead", (route) =>
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            caseId: "case-browser-success",
            replay: false,
          }),
        }),
      );
      page.on("request", (request) => {
        if (request.url().includes("/api/site-lead") && request.method() === "POST") {
          siteLeadRequests.push(request.url());
        }
      });

      await page.goto(
        "/inicie-seu-projeto",
      );

      await fillValidProjectStartForm(page);

      const requestPromise = page.waitForRequest(
        (request) =>
          request.url().includes("/api/site-lead") &&
          request.method() === "POST",
      );

      await page.getByRole(
        "button",
        {
          name:
            "Enviar contexto do projeto",
        },
      ).click();

      await requestPromise;

      await expect(
        page.locator("[data-whatsapp-fallback]"),
      ).toBeVisible();

      // exactly one Atlas submission — no duplicate lead ingress
      expect(siteLeadRequests).toHaveLength(1);

      const events =
        await readEvents(page);

      const leadEvents =
        events.filter(
          (event) =>
            event.eventName ===
            "lead_submitted",
        );

      // exactly one semantic event for the one successful submission
      expect(leadEvents).toHaveLength(1);

      expect(leadEvents[0]).toEqual({
        schemaVersion:
          "site-analytics.v1",
        eventName:
          "lead_submitted",
        context: {
          pageRef:
            "/inicie-seu-projeto",
          route:
            "/inicie-seu-projeto",
          templateRef:
            "site",
          componentRef:
            "project_start_form",
        },
        subjectRef:
          "residencial",
        channelRef:
          "site_form",
      });

      const serialized =
        JSON.stringify(events);

      expect(serialized).not.toContain(
        "Pessoa Analytics",
      );

      expect(serialized).not.toContain(
        "analytics@example.com",
      );

      expect(serialized).not.toContain(
        "11987654321",
      );

      expect(serialized).not.toContain(
        "Cidade Analytics",
      );

      expect(serialized).not.toContain(
        "Conteúdo sensível de teste",
      );

      // WhatsApp continuation semantics remain unchanged: opt-in button
      // opens the composed WhatsApp handoff, independent of analytics.
      await page.evaluate(() => {
        const browserWindow = window as Window & { __openedUrl?: string };
        window.open = ((url?: string | URL) => {
          browserWindow.__openedUrl = String(url ?? "");
          return window;
        }) as typeof window.open;
      });

      await page.locator("[data-whatsapp-fallback] [data-open-whatsapp]").click();

      const openedUrl = await page.evaluate(
        () => (window as Window & { __openedUrl?: string }).__openedUrl,
      );

      expect(openedUrl).toContain("https://wa.me/5521982590643?text=");
    });

    test("does not dispatch lead_submitted on client-side validation failure", async ({
      page,
    }) => {
      await page.goto(
        "/inicie-seu-projeto",
      );

      // Submit with every required field left empty.
      await page.getByRole(
        "button",
        {
          name:
            "Enviar contexto do projeto",
        },
      ).click();

      await expect(
        page.locator("[data-error-summary]"),
      ).toBeVisible();

      const events = await readEvents(page);
      expect(
        events.some((event) => event.eventName === "lead_submitted"),
      ).toBe(false);
    });

    test("does not dispatch lead_submitted when the Atlas submission fails", async ({
      page,
    }) => {
      await page.route(
        "**/api/site-lead",
        (route) => route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
      );

      await page.goto(
        "/inicie-seu-projeto",
      );

      await fillValidProjectStartForm(page);

      const requestPromise = page.waitForRequest(
        (request) =>
          request.url().includes("/api/site-lead") &&
          request.method() === "POST",
      );

      await page.getByRole(
        "button",
        {
          name:
            "Enviar contexto do projeto",
        },
      ).click();

      await requestPromise;

      await expect(
        page.locator("[data-error-summary]"),
      ).toBeVisible();
      await expect(
        page.locator("[data-whatsapp-fallback]"),
      ).toBeHidden();

      const events = await readEvents(page);
      expect(
        events.some((event) => event.eventName === "lead_submitted"),
      ).toBe(false);
    });
  },
);

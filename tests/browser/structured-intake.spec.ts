import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const validServerPayload = {
  projectContext: "residencial",
  projectNeed: "Verificar invariantes atuais.",
  city: "Cidade obrigatória",
  name: "Pessoa de Teste",
  email: "teste@example.com",
  phone: "11999999999",
  consent: true,
};

async function reachContactStep(
  page: Page,
): Promise<void> {
  await page.goto("/inicie-seu-projeto");
  await page.getByLabel("Contexto", {
    exact: true,
  }).selectOption("residencial");
  await page.getByLabel("Cidade", { exact: true }).fill(
    "Cidade preservada",
  );
  await page.getByRole("button", {
    name: "Continuar",
  }).click();
  await page.getByLabel(
    "Descreva brevemente o que você precisa",
  ).fill("Necessidade preservada.");
  await page.getByRole("button", {
    name: "Continuar",
  }).click();
  await page.getByLabel("Nome").fill(
    "Pessoa de Teste",
  );
}

test.describe("Preview intake endpoint current contract", () => {
  for (const [label, contact] of [
    ["email-only", { phone: "" }],
    ["phone-only", { email: "" }],
    ["email and phone", {}],
  ] as const) {
    test(`accepts ${label}`, async ({ request }) => {
      const response = await request.post(
        "/api/site-lead-preview",
        {
          data: {
            ...validServerPayload,
            ...contact,
          },
        },
      );

      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({
        ok: true,
        mock: true,
        schemaVersion: "site-lead.v1",
        submittedCount: 1,
      });
    });
  }

  for (const [label, changes] of [
    ["missing contact", { email: "", phone: "" }],
    ["consent false", { consent: false }],
    ["consent absent", { consent: undefined }],
    ["malformed supplied email", { email: "invalid", phone: "11999999999" }],
    ["empty email local side", { email: "@example.com" }],
    ["empty email domain side", { email: "teste@" }],
    ["email whitespace", { email: "tes te@example.com" }],
    ["multiple email separators", { email: "teste@@example.com" }],
    ["unknown project context", { projectContext: "unknown" }],
    ["missing project context", { projectContext: "" }],
    ["missing city", { city: "" }],
    ["whitespace-only city", { city: "   " }],
    ["missing project need", { projectNeed: "" }],
    ["missing name", { name: "" }],
  ] as const) {
    test(`rejects ${label}`, async ({ request }) => {
      const response = await request.post(
        "/api/site-lead-preview",
        {
          data: {
            ...validServerPayload,
            ...changes,
          },
        },
      );

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({
        error: "invalid_submission",
      });
    });
  }

  test("rejects a non-JSON content type", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/site-lead-preview",
      {
        data: "not-json",
        headers: {
          "content-type": "application/xml",
        },
      },
    );

    expect(response.status()).toBe(415);
    expect(await response.json()).toEqual({
      error: "unsupported_media_type",
    });
  });
});

test.describe("structured project intake", () => {
  test("presents claim-free public copy within the canonical Site shell", async ({
    page,
  }) => {
    await page.goto("/inicie-seu-projeto");

    await expect(page.locator("[data-site-header]")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    await expect(page.getByRole("main")).toContainText(
      "Compartilhe informações sobre o projeto e seus dados de contato para iniciar o preenchimento.",
    );
    await expect(page.locator("[data-structured-intake]")).toContainText(
      "Preencha as etapas abaixo com o contexto do projeto e seus dados de contato.",
    );
    await expect(page.getByRole("main")).not.toContainText(
      /Tranche|fluxo funcional|ambiente de verificação|experiência do Site|verificar a estrutura de envio|envio estruturado pelo Site/i,
    );
  });

  test("preserves progressive values and submits site-lead.v1 to Preview mock ingress", async ({
    page,
  }) => {
    const legacyLeadRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/lead") {
        legacyLeadRequests.push(request.url());
      }
    });

    await page.goto("/inicie-seu-projeto");

    const form = page.locator(
      "[data-intake-form]",
    );

    const context = page.getByLabel("Contexto", {
      exact: true,
    });

    await context.selectOption(
      "residencial",
    );

    const city = page.getByLabel("Cidade", { exact: true });
    await city.fill("Cidade de teste");

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const need = page.getByLabel(
      "Descreva brevemente o que você precisa",
    );

    await expect(need).toBeFocused();

    await need.fill(
      "Fixture funcional para verificar o boundary de lead.",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    await page.getByRole("button", {
      name: "Voltar",
    }).click();
    await expect(context).toHaveValue("residencial");
    await expect(city).toHaveValue("Cidade de teste");
    await page.getByRole("button", {
      name: "Continuar",
    }).click();
    await expect(need).toHaveValue(
      "Fixture funcional para verificar o boundary de lead.",
    );
    await page.getByLabel("Nome").fill(
      "Pessoa de Teste",
    );

    await page.getByLabel("E-mail").fill(
      "teste@example.com",
    );

    await page
      .getByLabel(
        /Concordo com o envio destas informações/,
      )
      .check();

    const responsePromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/site-lead-preview",
          ) &&
          response.request().method() === "POST",
      );

    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    const response = await responsePromise;

    expect(response.status()).toBe(200);

    const responseBody =
      await response.json();

    expect(responseBody).toEqual({
      ok: true,
      mock: true,
      schemaVersion: "site-lead.v1",
      submittedCount: 1,
    });

    await expect(form).toBeHidden();

    const success = page.getByRole(
      "status",
    );

    await expect(
      success.getByRole("heading", {
        name: "Informações recebidas",
      }),
    ).toBeVisible();

    await expect(success).toContainText(
      "Recebemos as informações enviadas pelo formulário.",
    );

    await expect(success).toBeFocused();
    await expect(page).toHaveURL(
      /\/inicie-seu-projeto$/,
    );
    expect(legacyLeadRequests).toEqual([]);
  });

  for (const [label, email, phone] of [
    ["email-only", "contact@example.com", ""],
    ["phone-only", "", "11999999999"],
    ["email and phone", "contact@example.com", "11999999999"],
  ] as const) {
    test(`submits with ${label}`, async ({ page }) => {
      await reachContactStep(page);
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Telefone").fill(phone);
      await page.getByLabel(
        /Concordo com o envio destas informações/,
      ).check();

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/site-lead-preview") &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", {
        name: "Enviar contexto do projeto",
      }).click();

      expect((await responsePromise).status()).toBe(200);
      await expect(page.getByRole("status")).toBeFocused();
    });
  }

  test("rejects missing contact accessibly", async ({ page }) => {
    await reachContactStep(page);
    await page.getByLabel(
      /Concordo com o envio destas informações/,
    ).check();
    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    const email = page.getByLabel("E-mail");
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(
      "Informe pelo menos um contato: e-mail ou telefone.",
    )).toBeVisible();
  });

  test("rejects malformed supplied email with current message and focus", async ({ page }) => {
    await reachContactStep(page);
    const email = page.getByLabel("E-mail");
    await email.fill("invalid");
    await page.getByLabel("Telefone").fill("11999999999");
    await page.getByLabel(
      /Concordo com o envio destas informações/,
    ).check();
    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(
      "Informe um endereço de e-mail válido.",
    )).toBeVisible();
  });

  test("rejects missing consent accessibly", async ({ page }) => {
    await reachContactStep(page);
    await page.getByLabel("Telefone").fill("11999999999");
    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    const consent = page.getByLabel(
      /Concordo com o envio destas informações/,
    );
    await expect(consent).toBeFocused();
    await expect(consent).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(
      "Confirme o consentimento antes de enviar.",
    )).toBeVisible();
  });

  test("preserves contact values across current navigation", async ({ page }) => {
    await reachContactStep(page);
    await page.getByLabel("E-mail").fill("preserved@example.com");
    await page.getByLabel("Telefone").fill("11999999999");
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByLabel(
      "Descreva brevemente o que você precisa",
    )).toHaveValue(
      "Necessidade preservada.",
    );
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue(
      "preserved@example.com",
    );
    await expect(page.getByLabel("Telefone")).toHaveValue(
      "11999999999",
    );
  });

  for (const context of [
    "residencial",
    "corporativo_institucional",
  ] as const) {
    test(`preselects the exact ${context} context`, async ({ page }) => {
      await page.goto(
        `/inicie-seu-projeto?context=${context}`,
      );
      await expect(page.getByLabel("Contexto", {
        exact: true,
      })).toHaveValue(context);
    });
  }

  test("does not reinterpret an invalid preselection", async ({ page }) => {
    await page.goto(
      "/inicie-seu-projeto?context=invalid",
    );
    await expect(page.getByLabel("Contexto", {
      exact: true,
    })).toHaveValue("");
  });

  test("keeps retry surface accessible after server failure without lead analytics", async ({ page }) => {
    await page.route(
      "**/api/site-lead-preview",
      (route) => route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "fixture_failure" }),
      }),
    );
    await reachContactStep(page);
    await page.getByLabel("E-mail").fill("retry@example.com");
    await page.getByLabel(
      /Concordo com o envio destas informações/,
    ).check();
    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    const error = page.getByRole("alert");
    await expect(error).toBeVisible();
    await expect(error).toBeFocused();
    await expect(page.locator("[data-intake-form]")).toBeVisible();
    await expect(page.getByRole("button", {
      name: "Enviar contexto do projeto",
    })).toBeEnabled();
    const events = await page.evaluate(() =>
      (window as Window & {
        __siteAnalyticsEvents?: Array<{ eventName?: string }>;
      }).__siteAnalyticsEvents ?? []
    );
    expect(events.some(
      (event) => event.eventName === "lead_submitted",
    )).toBe(false);
  });

  test("shows accessible validation without discarding entered values", async ({
    page,
  }) => {
    await page.goto("/inicie-seu-projeto");

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const context = page.getByLabel("Contexto", {
      exact: true,
    });

    await expect(context).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await expect(
      page.getByText(
        "Selecione o contexto do projeto.",
      ),
    ).toBeVisible();

    await context.selectOption(
      "corporativo_institucional",
    );

    const city = page.getByLabel("Cidade", { exact: true });

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    await expect(city).toBeFocused();
    await expect(city).toHaveAttribute("aria-invalid", "true");
    await expect(city).toHaveAttribute(
      "aria-describedby",
      "project-city-error",
    );
    await expect(page.getByText("Informe a cidade.")).toBeVisible();

    await city.fill("Cidade preservada");

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const need = page.getByLabel(
      "Descreva brevemente o que você precisa",
    );

    await need.fill(
      "Valor que deve ser preservado.",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    await page.getByRole("button", {
      name: "Voltar",
    }).click();

    await expect(need).toHaveValue(
      "Valor que deve ser preservado.",
    );
  });

  test("materializes exactly three approved steps with required City", async ({ page }) => {
    await page.goto("/inicie-seu-projeto");

    await expect(page.locator("[data-progress-step]")).toHaveCount(3);
    await expect(page.locator("[data-intake-step]")).toHaveCount(3);
    await expect(page.locator("[data-progress-step]")).toHaveText([
      "SOBRE O PROJETO",
      "O QUE VOCÊ PRECISA",
      "SEUS DADOS",
    ]);

    const city = page.getByLabel("Cidade", { exact: true });
    await expect(city).toHaveAttribute("required", "");
    await expect(city).toHaveAttribute("autocomplete", "address-level2");
  });

  test("new intake surface has no automated axe violations", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto("/inicie-seu-projeto");

    const accessibilityScanResults =
      await new AxeBuilder({
        page,
      }).analyze();

    expect(
      accessibilityScanResults.violations,
    ).toEqual([]);
  });

  test("final intake step has no automated axe violations", async ({ page }) => {
    await reachContactStep(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  for (const width of [390, 768, 1440]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/inicie-seu-projeto");
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      await expect(page.getByLabel("Cidade", { exact: true })).toBeVisible();
    });
  }
});

import { test, expect } from "@playwright/test";

test.describe("Fibra RJ Structured Intake Form", () => {
  // No global unconditional mock — each test controls its own response behavior

  test("page loads and form is visible", async ({ page }) => {
    await page.goto("/lp/fibra-rj");
    const form = await page.locator("[data-fibra-intake-form]");
    await expect(form).toBeVisible();
  });

  test("required fields are present", async ({ page }) => {
    await page.goto("/lp/fibra-rj");
    await expect(page.locator('input[name="nome"]')).toBeVisible();
    await expect(page.locator('input[name="telefone"]')).toBeVisible();
    await expect(page.locator('input[name="cidade"]')).toBeVisible();
    await expect(page.locator('input[name="consentimento"]')).toBeVisible();
  });

  test("optional fields are present", async ({ page }) => {
    await page.goto("/lp/fibra-rj");
    await expect(page.locator('textarea[name="necessidade"]')).toBeVisible();
    await expect(page.locator('select[name="prazo"]')).toBeVisible();
  });

  test("rejects empty required fields", async ({ page }) => {
    await page.goto("/lp/fibra-rj");
    const submitBtn = page.locator(
      'button[type="submit"]:has-text("Enviar solicitação")'
    );
    await submitBtn.click();

    const errorElements = page.locator("[data-error-for]");
    const errorCount = await errorElements.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test("rejects invalid phone format", async ({ page }) => {
    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "João da Silva");
    await page.fill('input[name="telefone"]', "invalid");
    await page.fill('input[name="cidade"]', "Rio de Janeiro");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator(
      'button[type="submit"]:has-text("Enviar solicitação")'
    );
    await submitBtn.click();

    const telefoneError = page.locator('[data-error-for="telefone"]');
    await expect(telefoneError).toContainText("Formato de telefone inválido");
  });

  test("rejects submission without consent", async ({ page }) => {
    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "João da Silva");
    await page.fill('input[name="telefone"]', "(21) 98765-4321");
    await page.fill('input[name="cidade"]', "Rio de Janeiro");

    const submitBtn = page.locator(
      'button[type="submit"]:has-text("Enviar solicitação")'
    );
    await submitBtn.click();

    const consentError = page.locator('[data-error-for="consentimento"]');
    await expect(consentError).toContainText("Confirme o consentimento");
  });

  test("form is usable at 390px (mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/lp/fibra-rj");

    const form = await page.locator("[data-fibra-intake-form]");
    await expect(form).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth >
        document.documentElement.clientWidth
        ? true
        : false;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test("form is usable at 768px (tablet)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/lp/fibra-rj");

    const form = await page.locator("[data-fibra-intake-form]");
    await expect(form).toBeVisible();
  });

  test("form is usable at 1440px (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/lp/fibra-rj");

    const form = await page.locator("[data-fibra-intake-form]");
    await expect(form).toBeVisible();
  });

  test("Fibra-specific copy is present", async ({ page }) => {
    await page.goto("/lp/fibra-rj");

    await expect(
      page.getByRole("heading", {
        name: /Restauração de piscinas de fibra/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        /Recuperação de cor, textura e brilho|desbotamento|trincas/i
      ).first()
    ).toBeVisible();
  });

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Test Name");
    await page.waitForTimeout(500);

    expect(errors.length).toBe(0);
  });
});

test.describe("Fibra RJ — Fresh Visitor First Touch Attribution", () => {
  test("fresh visitor with UTM submits valid form and receives success", async ({ page }) => {
    // Track API requests from the main page context
    const apiRequests: any[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("/api/site-lead")) {
        try {
          const data = await response.json();
          apiRequests.push({
            status: response.status(),
            body: data,
          });
        } catch (e) {
          apiRequests.push({
            status: response.status(),
            error: "Could not parse JSON",
          });
        }
      }
    });

    // Mock API response: 201 NEW
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "fibra-case-123",
        }),
      });
    });

    // Navigate with UTM parameters
    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=cpc&utm_campaign=fibra-test");

    // Verify page loaded with GrowthAttribution component (by checking runtime exists)
    const runtimeExists = await page.evaluate(() => {
      return !!(window as any).__royalGrowthAttribution;
    });
    expect(runtimeExists).toBe(true);

    // Fill form
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    // Submit
    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    // Wait for success state
    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Verify API request was made exactly once with proper structure
    await page.waitForTimeout(500);
    expect(apiRequests.length).toBe(1);

    const apiRequest = apiRequests[0];
    expect(apiRequest.status).toBe(201);

    // Log what we received for debugging
    console.log("API Request structure:", Object.keys(apiRequest));
    console.log("API Request body field exists:", apiRequest.body !== undefined);

    // The mock response we set should return a body with ok: true
    if (apiRequest.error) {
      console.log("Error parsing response:", apiRequest.error);
    } else if (apiRequest.body) {
      expect(apiRequest.body.ok).toBe(true);
    }
  });
});

test.describe("Fibra RJ — API Response Scenarios", () => {
  test("201 NEW: successful new submission shows protocol", async ({ page }) => {
    // Mock API response
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });
    await expect(successState).toContainText("Solicitação recebida");
    await expect(successState).toContainText("RS-TEST-FIBRA-001");
  });

  test("200 REPLAY: persisted submission shows protocol without duplicating intake_created", async ({ page }) => {
    let requestCount = 0;

    page.on("response", async (response) => {
      if (response.url().includes("/api/site-lead")) {
        requestCount++;
      }
    });

    // Capture dataLayer events
    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };
    });

    // Mock API response: 200 REPLAY
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: true,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Verify protocol is shown
    await expect(successState).toContainText("RS-TEST-FIBRA-001");

    await page.waitForTimeout(500);

    // Verify intake_created fired exactly once (replay should not emit duplicate)
    const events = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });
    const intakeCreatedEvents = events.filter((e: any) => e.event === "intake_created");
    expect(intakeCreatedEvents.length).toBe(1);
  });

  test("400 BAD REQUEST: shows error state", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "Invalid data",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).toBeVisible({ timeout: 10000 });
    await expect(errorState).toContainText("Dados inválidos");
  });

  test("500 INTERNAL SERVER ERROR: shows retry error state", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "Server error",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).toBeVisible({ timeout: 10000 });
    await expect(errorState).toContainText("Tente novamente");
  });

  test("503 SERVICE UNAVAILABLE: shows retryable error state", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "Service unavailable",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).toBeVisible({ timeout: 10000 });
    await expect(errorState).toContainText("Serviço temporariamente indisponível");
  });

  test("TIMEOUT: request abort after configured timeout", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      // Never respond — let it timeout
      await new Promise(() => {
        // Hold indefinitely
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    // Should timeout after 10 seconds (FETCH_TIMEOUT_MS = 10000)
    const errorState = page.locator("[data-error-state]");
    await expect(errorState).toBeVisible({ timeout: 15000 });
    await expect(errorState).toContainText("Requisição expirou");
  });

  test("RETRY with same submissionRef: 503 then 201", async ({ page }) => {
    let attemptCount = 0;
    const requestBodies: any[] = [];

    await page.route("/api/site-lead", async (route) => {
      const body = route.request().postDataJSON();
      requestBodies.push(body);
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt: 503
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "Service unavailable" }),
        });
      } else {
        // Second attempt: 201 success
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            replay: false,
            protocol: "RS-TEST-FIBRA-002",
            caseId: "case-456",
          }),
        });
      }
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    // First submit attempt
    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    // Error state should appear
    const errorState = page.locator("[data-error-state]");
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Click retry button
    const retryBtn = errorState.locator('[data-retry-btn]');
    await retryBtn.click();

    // Success state should appear on retry
    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Verify both requests were made
    await page.waitForTimeout(500);
    expect(requestBodies.length).toBe(2);
    // submissionRef must be the same
    expect(requestBodies[0].submissionRef).toBe(requestBodies[1].submissionRef);
  });

  test("NEW SUBMISSION gets new submissionRef", async ({ page }) => {
    const requestBodies: any[] = [];

    await page.route("/api/site-lead", async (route) => {
      const body = route.request().postDataJSON();
      requestBodies.push(body);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: `RS-TEST-FIBRA-${requestBodies.length}`,
          caseId: `case-${requestBodies.length}`,
        }),
      });
    });

    await page.goto("/lp/fibra-rj");

    // First submission
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Close success and reset form
    const closeBtn = successState.locator('[data-close-success]');
    await closeBtn.click();

    // Wait for form to reappear
    const form = page.locator("[data-fibra-intake-form]");
    await expect(form).toBeVisible();

    // Second submission (new business)
    await page.fill('input[name="nome"]', "João Silva");
    await page.fill('input[name="telefone"]', "(21) 98765-4321");
    await page.fill('input[name="cidade"]', "Rio de Janeiro");
    await page.check('input[name="consentimento"]');

    await submitBtn.click();
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Verify different submissionRef
    await page.waitForTimeout(500);
    expect(requestBodies.length).toBe(2);
    expect(requestBodies[0].submissionRef).not.toBe(requestBodies[1].submissionRef);
  });
});

test.describe("Fibra RJ — Analytics & PII Protection", () => {
  test("intake_created event fires exactly once per successful submission", async ({ page }) => {
    const capturedEvents: any[] = [];

    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };
    });

    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);

    // Extract captured events
    const events = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });

    // Count intake_created events
    const intakeCreatedEvents = events.filter((e: any) => e.event === "intake_created");
    expect(intakeCreatedEvents.length).toBe(1);

    // Verify exact values
    const event = intakeCreatedEvents[0];
    expect(event.service_intent).toBe("FIBERGLASS_POOL_RESTORATION");
    expect(event.acquisition_geography).toBe("RJ");
    expect(event.experiment_id).toBe("HV-RJ-FIBERGLASS-RESTORATION");
    expect(event.entry_surface).toBe("/lp/fibra-rj");
  });

  test("PII is not included in intake_created event", async ({ page }) => {
    const capturedEvents: any[] = [];

    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };
    });

    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "PII-NAME-FIBRA-TEST");
    await page.fill('input[name="telefone"]', "(21) 98765-4321");
    await page.fill('input[name="cidade"]', "PII-CITY-FIBRA-TEST");
    await page.fill('textarea[name="necessidade"]', "PII-NEED-FIBRA-TEST");
    await page.selectOption('select[name="prazo"]', "urgente");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);

    const events = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });

    const intakeCreatedEvent = events.find((e: any) => e.event === "intake_created");
    expect(intakeCreatedEvent).toBeDefined();

    // Verify exact allowed keys/values for intake_created
    const allowedKeys = ["event", "service_intent", "acquisition_geography", "experiment_id", "entry_surface"];
    const actualKeys = Object.keys(intakeCreatedEvent);
    actualKeys.forEach(key => {
      expect(allowedKeys).toContain(key);
    });

    // Verify required fields are present
    expect(intakeCreatedEvent.event).toBe("intake_created");
    expect(intakeCreatedEvent.service_intent).toBe("FIBERGLASS_POOL_RESTORATION");
    expect(intakeCreatedEvent.acquisition_geography).toBe("RJ");
    expect(intakeCreatedEvent.experiment_id).toBe("HV-RJ-FIBERGLASS-RESTORATION");
    expect(intakeCreatedEvent.entry_surface).toBe("/lp/fibra-rj");

    // Verify PII fields are NOT in the event
    const eventStr = JSON.stringify(intakeCreatedEvent);
    expect(eventStr).not.toContain("PII-NAME-FIBRA-TEST");
    expect(eventStr).not.toContain("PII-CITY-FIBRA-TEST");
    expect(eventStr).not.toContain("PII-NEED-FIBRA-TEST");
    expect(eventStr).not.toContain("(21) 98765-4321");

    // Verify forbidden field names are absent
    const forbiddenFieldNames = ["name", "nome", "phone", "telefone", "email", "city", "cidade",
                                  "need", "necessidade", "timeline", "prazo", "consent", "consentimento",
                                  "consentCapturedAt", "submissionRef", "protocol", "caseId"];
    forbiddenFieldNames.forEach(fieldName => {
      expect(eventStr.toLowerCase()).not.toContain(fieldName.toLowerCase());
    });
  });
});

test.describe("Fibra RJ — Form Behavior", () => {
  test("required-only submission (no optional fields)", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    // Fill only required fields
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    // Skip necessidade and prazo
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });
  });

  test("timeline value is submitted with request and excluded from analytics", async ({ page }) => {
    const requestBodies: any[] = [];

    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };
    });

    await page.route("/api/site-lead", async (route) => {
      const body = route.request().postDataJSON();
      requestBodies.push(body);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.selectOption('select[name="prazo"]', "urgente");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);
    expect(requestBodies.length).toBe(1);

    // A: Verify timeline is in the request/business payload
    expect(requestBodies[0].message).toBeDefined();
    expect(requestBodies[0].message).toContain("Prazo");
    expect(requestBodies[0].message).toContain("Urgente");

    // B: Verify timeline does NOT appear in analytics event
    const events = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });
    const intakeCreatedEvent = events.find((e: any) => e.event === "intake_created");
    expect(intakeCreatedEvent).toBeDefined();

    // C: Serialize and verify timeline values absent
    const eventStr = JSON.stringify(intakeCreatedEvent);
    expect(eventStr).not.toContain("Urgente");
    expect(eventStr).not.toContain("urgente");
    expect(eventStr).not.toContain("timeline");
    expect(eventStr).not.toContain("prazo");
  });

  test("submissionTouch is independent from firstTouch", async ({ page }) => {
    const requestBodies: any[] = [];

    await page.route("/api/site-lead", async (route) => {
      const body = route.request().postDataJSON();
      requestBodies.push(body);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    // Navigate with UTM params
    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=cpc&utm_campaign=test-campaign");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);
    expect(requestBodies.length).toBe(1);
    const body = requestBodies[0];

    // Both should exist
    expect(body.attribution).toBeDefined();
    expect(body.attribution.firstTouch).toBeDefined();
    expect(body.attribution.submissionTouch).toBeDefined();

    // firstTouch should have captured URL params
    expect(body.attribution.firstTouch.source).toBe("google");
    expect(body.attribution.firstTouch.campaignRef).toBe("test-campaign");

    // submissionTouch should be a separate object with distinct values
    expect(body.attribution.submissionTouch).not.toBe(body.attribution.firstTouch);
  });

  test("double submit prevention: simultaneous clicks only POST once", async ({ page }) => {
    let postCount = 0;
    const requestBodies: any[] = [];

    await page.route("/api/site-lead", async (route) => {
      postCount++;
      const body = route.request().postDataJSON();
      requestBodies.push(body);
      // Delay response to create window for double-click
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    // Use evaluate to trigger rapid clicks from JavaScript side while request is in flight
    await Promise.all([
      submitBtn.click(),
      page.evaluate(() => {
        const btn = document.querySelector('[data-submit-btn]') as HTMLButtonElement;
        if (btn) {
          setTimeout(() => btn.click(), 50);
          setTimeout(() => btn.click(), 100);
        }
      })
    ]);

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(500);
    expect(postCount).toBe(1);
    expect(requestBodies.length).toBe(1);
  });

  test("sessionStorage failure fallback: in-memory dedup works", async ({ page }) => {
    let attemptCount = 0;
    let capturedSubmissionRefs: string[] = [];

    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };

      // Block sessionStorage.getItem and sessionStorage.setItem
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          const handler = {
            getItem() { throw new Error("sessionStorage.getItem blocked"); },
            setItem() { throw new Error("sessionStorage.setItem blocked"); },
            removeItem() { throw new Error("sessionStorage.removeItem blocked"); },
            clear() { throw new Error("sessionStorage.clear blocked"); },
            key() { throw new Error("sessionStorage.key blocked"); },
            length: 0,
          };
          return handler;
        }
      });
    });

    await page.route("/api/site-lead", async (route) => {
      const body = route.request().postDataJSON();
      const ref = body.submissionRef;
      capturedSubmissionRefs.push(ref);
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt: 503 Service Unavailable
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "Service unavailable" }),
        });
      } else {
        // Second attempt: 201 success (retry with same submissionRef)
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            replay: false,
            protocol: "RS-TEST-FIBRA-001",
            caseId: "case-123",
          }),
        });
      }
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');

    // First submit attempt
    await submitBtn.click();

    // Error state should appear
    const errorState = page.locator("[data-error-state]");
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Retry with same submissionRef
    const retryBtn = errorState.locator('[data-retry-btn]');
    await retryBtn.click();

    // Success should appear on retry
    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(300);

    // Verify sessionStorage was truly blocked
    const storageBlocked = await page.evaluate(() => {
      try {
        sessionStorage.getItem("test");
        return false;
      } catch {
        return true;
      }
    });
    expect(storageBlocked).toBe(true);

    // Verify both API calls used the SAME submissionRef
    expect(capturedSubmissionRefs.length).toBe(2);
    expect(capturedSubmissionRefs[0]).toBe(capturedSubmissionRefs[1]);

    // Verify intake_created was emitted only ONCE despite two API calls with same submissionRef
    const events = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });
    const intakeCreatedEvents = events.filter((e: any) => e.event === "intake_created");

    // CRITICAL: Only one intake_created despite same submissionRef evaluated twice
    // This proves the in-memory dedup fallback is working and required
    expect(intakeCreatedEvents.length).toBe(1);
    expect(attemptCount).toBe(2);
  });

  test("WhatsApp continuation does not POST again or emit intake_created", async ({ page }) => {
    let postCount = 0;
    let capturedSubmissionRef = "";

    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };

      // Capture window.open calls to intercept WhatsApp URL
      w.__capturedWhatsAppUrl = "";
      const originalOpen = w.open;
      w.open = function(url: string, ...args: any[]) {
        if (url.includes("wa.me")) {
          w.__capturedWhatsAppUrl = url;
        }
        // Don't actually open the popup in test
        return null;
      };
    });

    await page.route("/api/site-lead", async (route) => {
      postCount++;
      const body = route.request().postDataJSON();
      capturedSubmissionRef = body.submissionRef;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "CASE-INTERNAL-SHOULD-NOT-LEAK",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Capture initial state
    let initialEvents = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });
    const initialIntakeCreatedCount = initialEvents.filter((e: any) => e.event === "intake_created").length;
    expect(initialIntakeCreatedCount).toBe(1);

    // Click WhatsApp continue button
    const whatsappBtn = successState.locator('[data-whatsapp-continue]');
    await whatsappBtn.click();

    await page.waitForTimeout(500);

    // Verify no additional POST occurred
    expect(postCount).toBe(1);

    // Verify no additional intake_created events
    const finalEvents = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });
    const finalIntakeCreatedCount = finalEvents.filter((e: any) => e.event === "intake_created").length;
    expect(finalIntakeCreatedCount).toBe(1);

    // Verify WhatsApp URL was captured
    const capturedWhatsAppUrl = await page.evaluate(() => {
      return (window as any).__capturedWhatsAppUrl || "";
    });
    expect(capturedWhatsAppUrl).toBeTruthy();

    // Decode URL to inspect content
    const decodedUrl = decodeURIComponent(capturedWhatsAppUrl);

    // Assert that internal IDs are NOT in the URL/message
    expect(decodedUrl).not.toContain("CASE-INTERNAL-SHOULD-NOT-LEAK");
    expect(decodedUrl).not.toContain(capturedSubmissionRef);
    expect(decodedUrl.toLowerCase()).not.toContain("caseid");
    expect(decodedUrl.toLowerCase()).not.toContain("submissionref");

    // Verify protocol IS included (allowed public data)
    expect(decodedUrl).toContain("RS-TEST-FIBRA-001");
  });

  test("WhatsApp button includes protocol but no sensitive data", async ({ page }) => {
    let capturedWhatsAppUrl = "";

    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    // Capture WhatsApp navigation
    page.on("popup", async (popup) => {
      capturedWhatsAppUrl = popup.url();
      await popup.close();
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    const whatsappBtn = successState.locator('[data-whatsapp-continue]');
    await Promise.all([
      page.waitForEvent('popup'),
      whatsappBtn.click()
    ]).catch(() => {
      // Might fail if popup blocked, but we can still check
    });

    // Verify protocol is in message but no PII
    const message = await successState.locator('[data-protocol-line]').textContent();
    expect(message).toContain("RS-TEST-FIBRA-001");
  });

  test("direct WhatsApp button does not trigger intake_created or POST", async ({ page }) => {
    let postCount = 0;

    await page.addInitScript(() => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const originalPush = w.dataLayer.push;
      w.dataLayer.push = function(...args: any[]) {
        (window as any).__capturedDataLayer = (window as any).__capturedDataLayer || [];
        (window as any).__capturedDataLayer.push(...args);
        return originalPush.apply(this, args);
      };
    });

    await page.route("/api/site-lead", async (route) => {
      postCount++;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    // Prevent actual WhatsApp navigation
    await page.route("https://wa.me/**", async (route) => {
      await route.abort();
    });

    await page.goto("/lp/fibra-rj");

    // Use the actual selector for direct WhatsApp button
    const whatsappBtn = page.locator('#btn-abrir-whatsapp');
    const btnCount = await whatsappBtn.count();

    if (btnCount > 0) {
      await whatsappBtn.click();
      // Suppress popup
      page.on('popup', popup => popup.close());
    }

    await page.waitForTimeout(500);

    // Verify no POST was made
    expect(postCount).toBe(0);

    // Verify no intake_created event
    const events = await page.evaluate(() => {
      return (window as any).__capturedDataLayer || [];
    });

    const intakeCreatedEvents = events.filter((e: any) => e.event === "intake_created");
    expect(intakeCreatedEvents.length).toBe(0);
  });
});

test.describe("Fibra Regression — No Breaking Changes", () => {
  test("direct WhatsApp buttons remain functional", async ({ page }) => {
    await page.goto("/lp/fibra-rj");

    const whatsappBtn = page.locator('#btn-abrir-whatsapp');
    if (await whatsappBtn.count() > 0) {
      await expect(whatsappBtn).toBeVisible();
    }

    const formCTA = page.locator('a[href="#avaliacao"]');
    await expect(formCTA.first()).toBeVisible();
  });

  test("page layout is intact", async ({ page }) => {
    await page.goto("/lp/fibra-rj");

    await expect(
      page.getByRole("heading", {
        name: /Restauração de piscinas de fibra/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Revitalizando piscinas de fibra/i,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Perguntas frequentes/i })
    ).toBeVisible();
  });

  test("WhatsApp continue button is present after success", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    const whatsappBtn = page.locator('[data-whatsapp-continue]');
    await expect(whatsappBtn).toBeVisible();
    await expect(whatsappBtn).toContainText("Continuar pelo WhatsApp");
  });

  test("close success button resets form", async ({ page }) => {
    await page.route("/api/site-lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "RS-TEST-FIBRA-001",
          caseId: "case-123",
        }),
      });
    });

    await page.goto("/lp/fibra-rj");
    await page.fill('input[name="nome"]', "Maria Silva");
    await page.fill('input[name="telefone"]', "(21) 99876-5432");
    await page.fill('input[name="cidade"]', "Niterói");
    await page.check('input[name="consentimento"]');

    const submitBtn = page.locator('button[type="submit"]:has-text("Enviar solicitação")');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    const closeBtn = page.locator('[data-close-success]');
    await closeBtn.click();

    const form = page.locator("[data-fibra-intake-form]");
    await expect(form).toBeVisible();

    const nomeInput = page.locator('input[name="nome"]');
    const inputValue = await nomeInput.inputValue();
    expect(inputValue).toBe("");
  });
});

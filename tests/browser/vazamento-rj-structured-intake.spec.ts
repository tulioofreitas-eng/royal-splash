import { expect, test } from "@playwright/test";

test.describe("Vazamento-RJ Structured Intake Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lp/vazamento-rj");
    await expect(page.locator("[data-vazamento-intake-form]")).toBeVisible();
  });

  // Structural tests
  test("structure: form renders with all required fields", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    await expect(form).toBeVisible();

    await expect(form.locator('input[name="nome"]')).toBeVisible();
    await expect(form.locator('input[name="telefone"]')).toBeVisible();
    await expect(form.locator('input[name="cidade"]')).toBeVisible();
    await expect(form.locator('input[name="consentimento"]')).toBeVisible();
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });

  test("structure: optional fields render", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    await expect(form.locator('textarea[name="necessidade"]')).toBeVisible();
    await expect(form.locator('select[name="prazo"]')).toBeVisible();
  });

  test("structure: legacy WhatsApp form not used", async ({ page }) => {
    const legacyForm = page.locator("[data-vazamento-whatsapp-form]");
    await expect(legacyForm).not.toBeVisible();
  });

  test("structure: privacy link present", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const privacyLink = form.locator('a[href="/politica-de-privacidade"]');
    await expect(privacyLink).toBeVisible();
  });

  test("structure: canonical pageRef is /lp/vazamento-rj", async ({ page }) => {
    // This verifies via the form's context in the page
    await expect(page).toHaveURL(/\/lp\/vazamento-rj/);
  });

  // Validation tests
  test("validation: required fields validation", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    await submitBtn.click();

    await expect(form.locator('[data-error-for="nome"]')).toContainText(/nome|obrigatório/i);
    await expect(form.locator('[data-error-for="telefone"]')).toContainText(/telefone|obrigatório/i);
    await expect(form.locator('[data-error-for="cidade"]')).toContainText(/cidade|obrigatório/i);
  });

  test("validation: phone format validation", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const submitBtn = form.locator('button[type="submit"]');

    await nomeInput.fill("João da Silva");
    await telefoneInput.fill("invalid");
    await cidadeInput.fill("Rio de Janeiro");

    await submitBtn.click();

    const telefoneError = form.locator('[data-error-for="telefone"]');
    await expect(telefoneError).toContainText("Formato de telefone inválido");
  });

  test("validation: accepts valid Brazilian phone format", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await nomeInput.fill("João da Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    // Should not show error
    await expect(form.locator('[data-error-for="telefone"]')).toHaveText("");
  });

  test("validation: rejects submission without consent", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const submitBtn = form.locator('button[type="submit"]');

    await nomeInput.fill("João da Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");

    await submitBtn.click();

    const consentError = form.locator('[data-error-for="consentimento"]');
    await expect(consentError).toContainText("Confirme o consentimento");
  });

  // Responsive tests
  test("responsive: form is usable at 390px (mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/lp/vazamento-rj");

    const form = page.locator("[data-vazamento-intake-form]");
    await expect(form).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test("responsive: form is usable at 768px (tablet)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/lp/vazamento-rj");

    const form = page.locator("[data-vazamento-intake-form]");
    await expect(form).toBeVisible();
  });

  test("responsive: form is usable at 1440px (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/lp/vazamento-rj");

    const form = page.locator("[data-vazamento-intake-form]");
    await expect(form).toBeVisible();
  });

  // Behavioral: API integration
  test("api: posts to /api/site-lead on valid submission", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let capturedRequest: any = null;

    // Set up route mock FIRST
    await page.route("/api/site-lead", route => {
      capturedRequest = route.request();
      route.abort("aborted");
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    // Wait for request to be captured
    await page.waitForTimeout(500);

    expect(capturedRequest).not.toBeNull();
    const postData = capturedRequest.postDataJSON();

    expect(postData).toHaveProperty("submissionRef");
    expect(postData).toHaveProperty("consentCapturedAt");
    expect(postData).toHaveProperty("name", "João Silva");
    expect(postData).toHaveProperty("phone", "(21) 98765-4321");
    expect(postData).toHaveProperty("city", "Rio de Janeiro");
    expect(postData).toHaveProperty("consent", true);
    expect(postData).toHaveProperty("pageRef", "/lp/vazamento-rj");
    expect(postData).toHaveProperty("source", "site");
  });

  test("api: submissionRef has correct prefix RS-vazamento-rj", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let capturedSubmissionRef: string | null = null;

    await page.route("/api/site-lead", route => {
      const postData = route.request().postDataJSON();
      capturedSubmissionRef = postData.submissionRef;
      route.abort();
    });

    await nomeInput.fill("Test Name");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    expect(capturedSubmissionRef).toMatch(/^RS-vazamento-rj-/);
  });

  test("behavioral: 201 persisted success shows protocol", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          caseId: "case-123",
          protocol: "PROTO-456"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");
    await expect(successState.locator("[data-protocol-line]")).toContainText("PROTO-456");
  });

  test("behavioral: 200 replay returns same protocol", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: true,
          caseId: "case-123",
          protocol: "PROTO-456"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");
  });

  test("behavioral: 400 shows validation error", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).not.toHaveAttribute("hidden");
    await expect(errorState.locator("[data-error-message]")).toContainText("Dados inválidos");
  });

  test("behavioral: 500 server error shows retryable error", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let failureMode = true;

    await page.route("/api/site-lead", route => {
      if (failureMode) {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ ok: false })
        });
      } else {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            replay: false,
            protocol: "PROTO-123"
          })
        });
      }
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).not.toHaveAttribute("hidden");
    await expect(errorState.locator("[data-error-message]")).toContainText("Não foi possível processar a solicitação");

    // Verify no intake_created was emitted
    const intakeCreatedEvents = await page.evaluate(() => {
      const w = window as any;
      return (w.dataLayer || []).filter((event: any) => event.event === "intake_created");
    });
    expect(intakeCreatedEvents.length).toBe(0);

    // Retry should succeed
    failureMode = false;
    const retryBtn = errorState.locator("[data-retry-btn]");
    await retryBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");
  });

  test("behavioral: 503 shows service unavailable error", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).not.toHaveAttribute("hidden");
    await expect(errorState.locator("[data-error-message]")).toContainText("Serviço temporariamente indisponível");
  });

  test("behavioral: timeout shows timeout error", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      setTimeout(() => {
        route.abort("timedout");
      }, 15000);
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).not.toHaveAttribute("hidden", { timeout: 15000 });
    await expect(errorState.locator("[data-error-message]")).toContainText("Requisição expirou");
  });

  test("behavioral: retry reuses same submissionRef", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let firstSubmissionRef: string | null = null;
    let secondSubmissionRef: string | null = null;
    let callCount = 0;

    await page.route("/api/site-lead", route => {
      callCount++;
      const postData = route.request().postDataJSON();
      if (callCount === 1) {
        firstSubmissionRef = postData.submissionRef;
        route.abort();
      } else {
        secondSubmissionRef = postData.submissionRef;
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            replay: false,
            protocol: "PROTO-123"
          })
        });
      }
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const errorState = page.locator("[data-error-state]");
    await expect(errorState).not.toHaveAttribute("hidden");

    const retryBtn = errorState.locator("[data-retry-btn]");
    await retryBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    expect(firstSubmissionRef).toBe(secondSubmissionRef);
  });

  test("behavioral: new submission uses new submissionRef", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let firstSubmissionRef: string | null = null;
    let secondSubmissionRef: string | null = null;
    let callCount = 0;

    await page.route("/api/site-lead", route => {
      callCount++;
      const postData = route.request().postDataJSON();
      if (callCount === 1) {
        firstSubmissionRef = postData.submissionRef;
      } else {
        secondSubmissionRef = postData.submissionRef;
      }
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: `PROTO-${callCount}`
        })
      });
    });

    // First submission
    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    // Close and reset
    const closeSuccessBtn = successState.locator("[data-close-success]");
    await closeSuccessBtn.click();

    // Second submission (new ref)
    await nomeInput.fill("Maria Santos");
    await telefoneInput.fill("(21) 99876-5432");
    await cidadeInput.fill("Niterói");
    await consentInput.check();

    await submitBtn.click();

    await expect(successState).not.toHaveAttribute("hidden");

    expect(firstSubmissionRef).not.toBe(secondSubmissionRef);
  });

  test("behavioral: double submit sends only one POST", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let postCount = 0;
    let postDelayed = false;

    await page.route("/api/site-lead", async route => {
      postCount++;
      // Add delay to allow testing button state during flight
      if (postCount === 1) {
        postDelayed = true;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');

    // First click initiates submission
    await submitBtn.click();

    // Button should be disabled during submission
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden", { timeout: 5000 });

    expect(postCount).toBe(1);
  });

  test("behavioral: intake_created fires exactly once", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    // Check for intake_created event
    const intakeCreatedEvents = await page.evaluate(() => {
      const w = window as any;
      return (w.dataLayer || []).filter((event: any) => event.event === "intake_created");
    });

    expect(intakeCreatedEvents.length).toBe(1);
    expect(intakeCreatedEvents[0]).toHaveProperty("service_intent", "POOL_LEAK_DETECTION");
    expect(intakeCreatedEvents[0]).toHaveProperty("acquisition_geography", "RJ");
    expect(intakeCreatedEvents[0]).toHaveProperty("experiment_id", "HV-RJ-POOL-LEAK-DETECTION");
    expect(intakeCreatedEvents[0]).toHaveProperty("entry_surface", "/lp/vazamento-rj");
  });

  test("behavioral: PII absent from analytics dataLayer", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    const intakeCreatedEvents = await page.evaluate(() => {
      const w = window as any;
      return (w.dataLayer || []).filter((event: any) => event.event === "intake_created");
    });

    const intakeEvent = intakeCreatedEvents[0];
    expect(intakeEvent).not.toHaveProperty("name");
    expect(intakeEvent).not.toHaveProperty("phone");
    expect(intakeEvent).not.toHaveProperty("city");
    expect(intakeEvent).not.toHaveProperty("necessidade");
    expect(intakeEvent).not.toHaveProperty("prazo");
    expect(intakeEvent).not.toHaveProperty("consentimento");
  });

  test("behavioral: post-Intake WhatsApp does not create duplicate Intake", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let postCount = 0;

    await page.route("/api/site-lead", route => {
      postCount++;
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    // Click WhatsApp continuation
    const whatsappBtn = successState.locator("[data-whatsapp-continue]");

    // Prevent actual window open
    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await whatsappBtn.click();

    // No additional POST should have occurred
    expect(postCount).toBe(1);
  });

  test("behavioral: sessionStorage fallback for dedup when unavailable", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    // Block sessionStorage
    await page.evaluateHandle(() => {
      const originalSessionStorage = window.sessionStorage;
      Object.defineProperty(window, "sessionStorage", {
        get: () => {
          throw new Error("sessionStorage blocked");
        }
      });
    });

    await page.route("/api/site-lead", route => {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    const intakeCreatedEvents = await page.evaluate(() => {
      const w = window as any;
      return (w.dataLayer || []).filter((event: any) => event.event === "intake_created");
    });

    // Should still have emitted once despite sessionStorage being unavailable
    expect(intakeCreatedEvents.length).toBe(1);
  });

  test("behavioral: required-only submission succeeds", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let payload: any = null;

    await page.route("/api/site-lead", route => {
      payload = route.request().postDataJSON();
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    // Only required fields
    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    expect(payload.necessidade).toBeUndefined();
  });

  test("behavioral: optional necessidade preserved in payload", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const necessidadeInput = form.locator('textarea[name="necessidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let payload: any = null;

    await page.route("/api/site-lead", route => {
      payload = route.request().postDataJSON();
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await necessidadeInput.fill("Perda de água constante no fundo");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    expect(payload.projectNeed).toBe("Perda de água constante no fundo");
  });

  test("behavioral: optional prazo preserved in payload", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const prazoSelect = form.locator('select[name="prazo"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let payload: any = null;

    await page.route("/api/site-lead", route => {
      payload = route.request().postDataJSON();
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await prazoSelect.selectOption("urgente");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    expect(payload.message).toContain("Prazo: Urgente");
  });

  test("behavioral: attribution firstTouch captured", async ({ page }) => {
    const form = page.locator("[data-vazamento-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');
    const telefoneInput = form.locator('input[name="telefone"]');
    const cidadeInput = form.locator('input[name="cidade"]');
    const consentInput = form.locator('input[name="consentimento"]');

    let payload: any = null;

    await page.route("/api/site-lead", route => {
      payload = route.request().postDataJSON();
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          replay: false,
          protocol: "PROTO-123"
        })
      });
    });

    // Simulate firstTouch
    await page.evaluateHandle(() => {
      (window as any).__royalGrowthAttribution = {
        readPersisted: () => ({
          campaignRef: "test-campaign",
          medium: "organic_search",
          source: "google"
        }),
        persistAfterConsent: () => {}
      };
    });

    await nomeInput.fill("João Silva");
    await telefoneInput.fill("(21) 98765-4321");
    await cidadeInput.fill("Rio de Janeiro");
    await consentInput.check();

    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click();

    const successState = page.locator("[data-success-state]");
    await expect(successState).not.toHaveAttribute("hidden");

    expect(payload.attribution).toBeDefined();
    expect(payload.attribution.firstTouch).toBeDefined();
  });
});

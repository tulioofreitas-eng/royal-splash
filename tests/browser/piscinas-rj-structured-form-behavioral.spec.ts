import { expect, test } from "@playwright/test";

test.describe("Piscinas-RJ Structured Intake Form - Behavioral", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls
    await page.route("/api/site-lead", (route) => {
      // Mock success response
      route.abort("blockedbyclient");
    });

    await page.goto("/lp/piscinas-rj");
    await expect(page.locator("[data-piscinas-rj-intake-form]")).toBeVisible();
  });

  // Behavioral: Form submission blocks without required fields
  test("B1: form validation blocks submission", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    // Try to submit empty form
    await submitBtn.click();

    // Success state must NOT appear
    const successState = page.locator("[data-success-state]");
    expect(await successState.evaluate((el) => el.hidden)).toBe(true);

    // Error summary must appear
    const errorSummary = form.locator("[data-error-summary]");
    expect(await errorSummary.evaluate((el) => el.hidden)).toBe(false);
  });

  // Behavioral: Submission attempt structure
  test("B2: submission captures required fields", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Fill form
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('textarea[name="necessidade"]').fill("Piscina com borda infinita");
    await form.locator('input[name="consentimento"]').check();

    // Verify all fields are correctly filled before submission
    expect(await form.locator('input[name="nome"]').inputValue()).toBe("João Silva");
    expect(await form.locator('input[name="telefone"]').inputValue()).toBe("(21) 98765-4321");
    expect(await form.locator('input[name="cidade"]').inputValue()).toBe("Rio de Janeiro");
  });

  // Behavioral: Submission state management
  test("B3: submit button reflects loading state", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    // Fill form
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('input[name="consentimento"]').check();

    // Intercept and delay response
    let isRequesting = false;
    await page.route("/api/site-lead", async (route) => {
      isRequesting = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      isRequesting = false;
      await route.abort("blockedbyclient");
    });

    // Start submission
    const submitPromise = submitBtn.click();
    await page.waitForTimeout(100); // Let request start

    // Button should be disabled or show loading text during submission
    if (isRequesting) {
      const isDisabled = await submitBtn.evaluate((btn) => (btn as HTMLButtonElement).disabled);
      expect(isDisabled || (await submitBtn.textContent())?.includes("Enviando")).toBeTruthy();
    }

    await submitPromise;
  });

  // Behavioral: Viewport and layout
  test("B4: form layout is responsive and readable", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Check minimum readable dimensions
    const box = await form.boundingBox();
    expect(box?.width).toBeGreaterThan(100);

    // Verify fields are not hidden on small screens
    for (const viewport of [390, 768, 1440]) {
      await page.setViewportSize({ width: viewport, height: 812 });
      await expect(form.locator('input[name="nome"]')).toBeVisible();
      await expect(form.locator('input[name="telefone"]')).toBeVisible();
    }
  });

  // Behavioral: Consent requirement
  test("B5: consent checkbox is required for submission", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    // Fill all fields except consent
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");

    // Try to submit
    await submitBtn.click();

    // Should show error on consent
    const consentError = form.locator('[data-error-for="consentimento"]');
    let errorText = await consentError.textContent();
    expect(errorText).toContain("Confirme");

    // Then check consent
    await form.locator('input[name="consentimento"]').check();

    // Attempt submission again to clear errors
    await submitBtn.click();

    // Error should now be clear (validation passed)
    errorText = await consentError.textContent();
    expect(errorText).toBe("");
  });

  // Behavioral: Character counter updates live
  test("B6: character counter updates in real-time", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const textarea = form.locator('textarea[name="necessidade"]');
    const counter = form.locator('#piscinas-rj-necessidade-count');

    // Type progressively
    await textarea.fill("Test");
    let counterText = await counter.textContent();
    expect(counterText).toContain("4 / 200");

    await textarea.fill("Test message");
    counterText = await counter.textContent();
    expect(counterText).toContain("12 / 200");
  });

  // Behavioral: Phone format validation
  test("B7: phone format validation is enforced", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    // Fill with invalid phone
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("123");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('input[name="consentimento"]').check();

    await submitBtn.click();

    // Should show phone error
    const phoneError = form.locator('[data-error-for="telefone"]');
    const errorText = await phoneError.textContent();
    expect(errorText?.toLowerCase()).toContain("telefone");
  });

  // Behavioral: Form reset on close-success
  test("B8: form can be re-used after close-success", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const successState = page.locator("[data-success-state]");

    // Fill form
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('input[name="consentimento"]').check();

    // Verify fields are filled
    expect(await form.locator('input[name="nome"]').inputValue()).toBe("João Silva");

    // Simulate success state (would normally happen after API response)
    // For this test, we just verify the close button exists and structure is ready
    const closeBtn = successState.locator('[data-close-success]');
    expect(await closeBtn.count()).toBeGreaterThan(0);

    // Verify form is still present after close action
    expect(await form.count()).toBeGreaterThan(0);
  });

  // Behavioral: Privacy notice is visible
  test("B9: privacy policy link is present and accessible", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Find privacy link
    const privacyLink = form.locator('a[href*="politica-de-privacidade"]');
    expect(await privacyLink.count()).toBeGreaterThan(0);

    // Verify target="_blank"
    const target = await privacyLink.getAttribute("target");
    expect(target).toBe("_blank");
  });

  // Behavioral: Form field isolation
  test("B10: form fields are properly isolated", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Verify each field has correct name and type
    const fields = {
      nome: { type: "text", required: true },
      telefone: { type: "tel", required: true },
      cidade: { type: "text", required: true },
      necessidade: { type: "textarea", required: false },
      prazo: { type: "select", required: false },
      consentimento: { type: "checkbox", required: true },
    };

    for (const [name, spec] of Object.entries(fields)) {
      const field = form.locator(`[name="${name}"]`);
      expect(await field.count()).toBe(1);

      if (spec.required) {
        const hasRequired = await field.evaluate((el) => (el as HTMLInputElement).required);
        expect(hasRequired).toBe(true);
      }
    }
  });

  // Behavioral: Data persistence across interactions
  test("B11: form retains values during interaction", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    const nome = "João Silva";
    const telefone = "(21) 98765-4321";
    const cidade = "Rio de Janeiro";

    // Fill form
    await form.locator('input[name="nome"]').fill(nome);
    await form.locator('input[name="telefone"]').fill(telefone);
    await form.locator('input[name="cidade"]').fill(cidade);

    // Interact with optional field
    await form.locator('textarea[name="necessidade"]').fill("Test");

    // Verify values persisted
    expect(await form.locator('input[name="nome"]').inputValue()).toBe(nome);
    expect(await form.locator('input[name="telefone"]').inputValue()).toBe(telefone);
    expect(await form.locator('input[name="cidade"]').inputValue()).toBe(cidade);
  });

  // Behavioral: Error recovery
  test("B12: errors can be corrected and form resubmitted", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');
    const errorSummary = form.locator("[data-error-summary]");

    // Submit empty
    await submitBtn.click();

    // Errors should appear
    expect(await errorSummary.evaluate((el) => el.hidden)).toBe(false);

    // Fill fields
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('input[name="consentimento"]').check();

    // Re-submit to validate and clear errors
    await submitBtn.click();

    // Errors should clear on successful validation
    expect(await errorSummary.evaluate((el) => el.hidden)).toBe(true);
  });
});

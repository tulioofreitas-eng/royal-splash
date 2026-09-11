import { expect, test } from "@playwright/test";

test.describe("Piscinas-RJ Structured Intake Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lp/piscinas-rj");
    // Wait for form to be present
    await expect(page.locator("[data-piscinas-rj-intake-form]")).toBeVisible();
  });

  // Rendering & Field Collection
  test("1: form renders with all required fields", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    await expect(form).toBeVisible();

    // Check for input fields by name (more reliable than label)
    await expect(form.locator('input[name="nome"]')).toBeVisible();
    await expect(form.locator('input[name="telefone"]')).toBeVisible();
    await expect(form.locator('input[name="cidade"]')).toBeVisible();
    await expect(form.locator('input[name="consentimento"]')).toBeVisible();
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });

  test("2: optional fields render", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Check optional fields
    await expect(form.locator('textarea[name="necessidade"]')).toBeVisible();
    await expect(form.locator('select[name="prazo"]')).toBeVisible();
  });

  // Validation
  test("3: required fields validation", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    // Try to submit empty
    await submitBtn.click();

    // Check for error messages
    await expect(form.locator('[data-error-for="nome"]')).toContainText(/nome|required/i);
    await expect(form.locator('[data-error-for="telefone"]')).toContainText(/telefone|required/i);
    await expect(form.locator('[data-error-for="cidade"]')).toContainText(/cidade|required/i);
  });

  test("4: can fill and clear form fields", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');

    await nomeInput.fill("João Silva");
    expect(await nomeInput.inputValue()).toBe("João Silva");

    await nomeInput.clear();
    expect(await nomeInput.inputValue()).toBe("");
  });

  // Form submission structure
  test("5: submit button exists", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');

    await expect(submitBtn).toBeVisible();
    expect(await submitBtn.textContent()).toContain("Enviar");
  });

  test("6: success state element exists", async ({ page }) => {
    const successState = page.locator("[data-success-state]");
    expect(await successState.count()).toBeGreaterThan(0);
  });

  test("7: error state element exists", async ({ page }) => {
    const errorState = page.locator("[data-error-state]");
    expect(await errorState.count()).toBeGreaterThan(0);
  });

  // Protocol line
  test("8: protocol line element exists in success state", async ({ page }) => {
    const protocolLine = page.locator("[data-protocol-line]");
    expect(await protocolLine.count()).toBeGreaterThan(0);
  });

  // CTA buttons in success state
  test("9: WhatsApp continue button exists", async ({ page }) => {
    const btn = page.getByRole("button", { name: /WhatsApp|whatsapp|Continuar/i });
    expect(await btn.count()).toBeGreaterThan(0);
  });

  test("10: wait-for-contact button exists", async ({ page }) => {
    // Look for button by data attribute instead of text
    const btn = page.locator('[data-close-success]');
    expect(await btn.count()).toBeGreaterThan(0);
  });

  // Responsive design
  test("11: mobile viewport (390px) renders", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 812 });
    const form = page.locator("[data-piscinas-rj-intake-form]");
    await expect(form).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(400);
  });

  test("12: tablet viewport (768px) renders", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const form = page.locator("[data-piscinas-rj-intake-form]");
    await expect(form).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(780);
  });

  test("13: desktop viewport (1440px) renders", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const form = page.locator("[data-piscinas-rj-intake-form]");
    await expect(form).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1450);
  });

  // Runtime
  test("14: no console errors on interaction", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    const form = page.locator("[data-piscinas-rj-intake-form]");
    const nomeInput = form.locator('input[name="nome"]');

    await nomeInput.fill("Test");
    await nomeInput.clear();

    // Small delay for any async errors
    await page.waitForTimeout(500);

    expect(errors.filter(e => !e.includes("favicon"))).toHaveLength(0);
  });

  test("15: form submission structure is valid", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Fill all required fields
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('input[name="consentimento"]').check();

    // Verify no validation errors
    const errorElements = await form.locator('[data-error-for]').all();
    let hasErrors = false;
    for (const el of errorElements) {
      const text = await el.textContent();
      if (text && text.trim().length > 0) {
        hasErrors = true;
      }
    }

    expect(hasErrors).toBe(false);
  });

  test("16: optional fields can be left empty", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");

    // Fill only required fields
    await form.locator('input[name="nome"]').fill("João Silva");
    await form.locator('input[name="telefone"]').fill("(21) 98765-4321");
    await form.locator('input[name="cidade"]').fill("Rio de Janeiro");
    await form.locator('input[name="consentimento"]').check();

    // Optional fields should have no required validation
    const necessidade = form.locator('textarea[name="necessidade"]');
    const prazo = form.locator('select[name="prazo"]');

    expect(await necessidade.inputValue()).toBe("");
    expect(await prazo.inputValue()).toBe("");

    // Verify no validation errors on optional fields by checking error summary
    const errorSummary = form.locator('[data-error-summary]');
    const summaryText = await errorSummary.textContent();
    expect(summaryText).toBe("");
  });

  test("17: form uses data attributes correctly", async ({ page }) => {
    expect(await page.locator("[data-piscinas-rj-intake-form]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-error-summary]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-success-state]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-error-state]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-protocol-line]").count()).toBeGreaterThan(0);
  });

  test("18: submit button text is visible", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const submitBtn = form.locator('button[type="submit"]');
    const text = await submitBtn.textContent();

    expect(text).toContain("Enviar");
  });

  test("19: character counter for necessidade works", async ({ page }) => {
    const form = page.locator("[data-piscinas-rj-intake-form]");
    const necessidade = form.locator('textarea[name="necessidade"]');
    const counter = form.locator('#piscinas-rj-necessidade-count');

    await necessidade.fill("Test message");

    const counterText = await counter.textContent();
    expect(counterText).toContain("12");
    expect(counterText).toContain("200");
  });
});

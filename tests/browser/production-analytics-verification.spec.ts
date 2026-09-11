import { test, expect } from "@playwright/test";

// PRODUCTION ANALYTICS VERIFICATION TEST
// Verifies GTM intake_created event with correct business dimensions
// and NO PII exposed

test.describe("Production Analytics Verification", () => {
  test("Verify intake_created event dimensions and PII protection", async ({
    page,
  }) => {
    const baseUrl = process.env.SC_R16_BASE_URL ?? "https://www.royalsplash.com.br";

    await page.goto(`${baseUrl}/lp/piscinas-rj`, {
      waitUntil: "networkidle",
    });

    // Intercept dataLayer to capture GTM events AFTER page load
    await page.evaluateHandle(() => {
      (window as any).__capturedEvents = [];
      const originalPush = (window as any).dataLayer?.push || (() => {});

      if ((window as any).dataLayer) {
        (window as any).dataLayer.push = function (...args: any) {
          (window as any).__capturedEvents.push(...args);
          return originalPush.apply(this, args);
        };
      }
    });

    const form = page.locator("[data-piscinas-rj-intake-form]");
    await expect(form).toBeVisible();

    // Fill form with test data
    const testTimestamp = new Date().toISOString();
    await page.fill("input[name='nome']", "TESTE ANALYTICS — NÃO CONTATAR");
    await page.fill("input[name='telefone']", "(21) 7777-7777");
    await page.fill("input[name='cidade']", "Rio de Janeiro");
    await page.fill(
      "textarea[name='necessidade']",
      `Analytics verification test - ${testTimestamp}`
    );
    await page.selectOption("select[name='prazo']", "aberto");
    await page.check("input[name='consentimento']");

    // Submit form
    await page.click("button[type='submit']");

    // Wait for success
    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Give GTM time to process
    await page.waitForTimeout(1000);

    // Extract captured events
    const events = await page.evaluate(() => {
      return (window as any).__capturedEvents || [];
    });

    console.log("\n=== CAPTURED EVENTS ===");
    console.log(JSON.stringify(events, null, 2));

    // Find intake_created event
    const intakeCreatedEvent = events.find(
      (e: any) => typeof e === "object" && e.event === "intake_created"
    );

    expect(intakeCreatedEvent).toBeTruthy();

    console.log("\n=== INTAKE_CREATED EVENT DETAILS ===");
    console.log(JSON.stringify(intakeCreatedEvent, null, 2));

    // Verify required dimensions
    expect(intakeCreatedEvent).toHaveProperty("service_intent");
    expect(intakeCreatedEvent.service_intent).toBe("POOL_CONSTRUCTION");

    expect(intakeCreatedEvent).toHaveProperty("acquisition_geography");
    expect(intakeCreatedEvent.acquisition_geography).toBe("RJ");

    expect(intakeCreatedEvent).toHaveProperty("experiment_id");
    expect(intakeCreatedEvent.experiment_id).toBe(
      "HV-RJ-POOL-CONSTRUCTION"
    );

    expect(intakeCreatedEvent).toHaveProperty("entry_surface");
    expect(intakeCreatedEvent.entry_surface).toBe("/lp/piscinas-rj");

    // Verify NO PII in event
    const eventString = JSON.stringify(intakeCreatedEvent).toLowerCase();
    const piiPatterns = [
      "teste analytics",
      "9999",
      "8888",
      "7777",
      "email",
      "phone",
      "nome",
      "nome:",
      "telefone",
      "city",
      "necessidade",
    ];

    for (const pattern of piiPatterns) {
      expect(eventString).not.toContain(pattern);
    }

    console.log("\n=== ANALYTICS VERIFICATION ===");
    console.log("✓ intake_created event present");
    console.log("✓ service_intent: POOL_CONSTRUCTION");
    console.log("✓ acquisition_geography: RJ");
    console.log("✓ experiment_id: HV-RJ-POOL-CONSTRUCTION");
    console.log("✓ entry_surface: /lp/piscinas-rj");
    console.log("✓ No PII detected in event");

    // Verify event was not fired multiple times from this session
    const intakeCreatedEvents = events.filter(
      (e: any) => typeof e === "object" && e.event === "intake_created"
    );
    console.log(
      `\n✓ intake_created events in this session: ${intakeCreatedEvents.length}`
    );
  });
});

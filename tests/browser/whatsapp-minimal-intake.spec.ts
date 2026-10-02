import { expect, test } from "@playwright/test";

test.describe("minimal WhatsApp Intake handoff", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__openedWhatsAppUrl = null;
      window.open = ((url?: string | URL) => {
        (window as any).__openedWhatsAppUrl = String(url ?? "");
        return null;
      }) as typeof window.open;
    });
  });

  test("captures name + phone with automatic LP origin before WhatsApp", async ({ page }) => {
    let capturedPayload: any = null;

    await page.route("**/api/site-lead", async (route) => {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          caseId: "case-whatsapp-1",
          protocol: "RS-WA-001",
          replay: false,
        }),
      });
    });

    await page.goto("/lp/piscinas-rj");

    await page.locator("#btn-abrir-whatsapp").click();

    const modal = page.locator("#whatsapp-modal");
    await expect(modal).toBeVisible();
    await expect(page.locator("#wa-tipo")).toHaveCount(0);

    await page.locator("#wa-nome").fill("Pessoa WhatsApp");
    await page.locator("#wa-telefone").fill("(21) 99999-8888");
    await page.locator("#wa-consentimento").check();
    await page.locator("#wa-enviar").click();

    await expect.poll(() => capturedPayload).not.toBeNull();

    expect(capturedPayload.name).toBe("Pessoa WhatsApp");
    expect(capturedPayload.phone).toBe("(21) 99999-8888");
    expect(capturedPayload.city).toBeUndefined();
    expect(capturedPayload.pageRef).toBe("/lp/piscinas-rj");
    expect(capturedPayload.source).toBe("site");
    expect(capturedPayload.projectContext).toBe("residencial");
    expect(capturedPayload.consent).toBe(true);
    expect(capturedPayload.submissionRef).toMatch(/^RS-whatsapp-/);

    await expect.poll(async () => {
      return page.evaluate(() => (window as any).__openedWhatsAppUrl);
    }).toContain("wa.me/5521982590643");

    await expect.poll(async () => {
      return page.evaluate(() =>
        ((window as any).dataLayer || []).filter(
          (entry: any) => entry?.event === "intake_created",
        ).length
      );
    }).toBe(1);
  });

  test("never blocks WhatsApp when Intake registration fails", async ({ page }) => {
    await page.route("**/api/site-lead", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "service_unavailable" }),
      });
    });

    await page.goto("/lp/vazamento-rj");
    await page.locator("#btn-abrir-whatsapp").click();
    await page.locator("#wa-nome").fill("Pessoa Fallback");
    await page.locator("#wa-telefone").fill("(21) 98888-7777");
    await page.locator("#wa-consentimento").check();
    await page.locator("#wa-enviar").click();

    await expect.poll(async () => {
      return page.evaluate(() => (window as any).__openedWhatsAppUrl);
    }).toContain("wa.me/5521982590643");

    const intakeCreatedCount = await page.evaluate(() =>
      ((window as any).dataLayer || []).filter(
        (entry: any) => entry?.event === "intake_created",
      ).length
    );
    expect(intakeCreatedCount).toBe(0);
  });
});

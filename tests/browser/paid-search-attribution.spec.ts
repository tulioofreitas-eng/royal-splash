import { expect, test } from "@playwright/test";

const storageKey = "royal_growth_first_touch.v1";

test.describe("P0 paid acquisition across real Astro page navigation (Preview mock)", () => {
  test("consented Marketing first touch survives a fresh internal page navigation", async ({ page }) => {
    // Preview does not load production GTM. Use an isolated consent double;
    // there are no real marketing tags, production credentials, or DB writes.
    await page.addInitScript(() => {
      (window as any).__royalMeasurementConsent = {
        get: () => ({ analytics: false, marketing: true }),
      };
    });

    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=CPC&utm_campaign=fibra_rj_test");

    await expect.poll(() => page.evaluate((key) =>
      localStorage.getItem(key), storageKey,
    )).not.toBeNull();

    await page.goto("/lp/reforma-rj");
    const record = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, storageKey);

    expect(record?.firstTouch).toMatchObject({
      medium: "paid_search",
      source: "google",
      campaignRef: "fibra_rj_test",
      landingPageRef: "/lp/fibra-rj",
    });
  });

  test("a later campaign cannot overwrite the already persisted first touch", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__royalMeasurementConsent = {
        get: () => ({ analytics: true, marketing: true }),
      };
    });

    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=cpc&utm_campaign=first_campaign");
    await expect.poll(() => page.evaluate((key) =>
      localStorage.getItem(key), storageKey,
    )).not.toBeNull();

    await page.goto("/lp/reforma-rj?utm_source=google&utm_medium=ppc&utm_campaign=later_campaign");
    const first = await page.evaluate((key) =>
      JSON.parse(localStorage.getItem(key) ?? "{}").firstTouch, storageKey,
    );

    expect(first.campaignRef).toBe("first_campaign");
    expect(first.landingPageRef).toBe("/lp/fibra-rj");
  });

  test("page observation without Marketing consent does not persist a first touch", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__royalMeasurementConsent = {
        get: () => ({ analytics: true, marketing: false }),
      };
    });

    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=cpc&utm_campaign=not_persisted");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey))
      .toBeNull();
  });
});

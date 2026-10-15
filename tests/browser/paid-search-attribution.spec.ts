import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const consentHead = readFileSync(
  new URL("../../src/components/GTMHead.astro", import.meta.url), "utf8",
);
const inlineConsentScript = consentHead.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
if (!inlineConsentScript) throw new Error("GTM consent manager source not found");

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
  test("grant → navigate → revoke → submit keeps the intake but omits paid attribution", async ({ page }) => {
    await page.addInitScript(() => {
      let choice = { analytics: false, marketing: true };
      (window as any).__royalMeasurementConsent = {
        get: () => choice,
      };
      (window as any).__setTestMarketing = (marketing: boolean) => {
        choice = { ...choice, marketing };
        window.dispatchEvent(new CustomEvent("royal:measurement-consent-changed", {
          detail: choice,
        }));
      };
    });

    const received: Array<Record<string, unknown>> = [];
    await page.route("**/api/site-lead", async (route) => {
      received.push(route.request().postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, caseId: "case-consent-test", replay: false }),
      });
    });

    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=cpc&utm_campaign=consent_revoke");
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey))
      .not.toBeNull();

    await page.goto("/lp/vazamento-rj");
    await page.evaluate(() => (window as any).__setTestMarketing(false));

    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey))
      .toBeNull();

    await page.locator("#vazamento-nome").fill("Pessoa Teste");
    await page.locator("#vazamento-telefone").fill("21987654321");
    await page.locator("#vazamento-cidade").fill("Rio de Janeiro");
    await page.locator("#vazamento-consentimento").check();
    await page.locator("[data-vazamento-intake-form] [data-submit-btn]").click();

    await expect.poll(() => received.length).toBe(1);
    expect(received[0]).toHaveProperty("consent", true);
    expect(received[0]).not.toHaveProperty("attribution");
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey))
      .toBeNull();
  });

  test("refusing Marketing from the start still allows intake without campaign metadata", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__royalMeasurementConsent = {
        get: () => ({ analytics: true, marketing: false }),
      };
    });

    const received: Array<Record<string, unknown>> = [];
    await page.route("**/api/site-lead", async (route) => {
      received.push(route.request().postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, caseId: "case-denied-test", replay: false }),
      });
    });

    await page.goto("/lp/vazamento-rj?utm_source=google&utm_medium=cpc&utm_campaign=denied_campaign");
    await page.locator("#vazamento-nome").fill("Pessoa Teste");
    await page.locator("#vazamento-telefone").fill("21987654321");
    await page.locator("#vazamento-cidade").fill("Rio de Janeiro");
    await page.locator("#vazamento-consentimento").check();
    await page.locator("[data-vazamento-intake-form] [data-submit-btn]").click();

    await expect.poll(() => received.length).toBe(1);
    expect(received[0]).not.toHaveProperty("attribution");
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey))
      .toBeNull();
  });

  test("two real tabs: Marketing revocation is propagated and strips submitted attribution", async ({ page, context }) => {
    await context.route("https://www.googletagmanager.com/**", route =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );

    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/site-lead", route => {
      payloads.push(route.request().postDataJSON());
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, caseId: "case-cross-tab", replay: false }),
      });
    });

    await page.goto("/lp/vazamento-rj?utm_source=google&utm_medium=CPC&utm_campaign=revocation_tabs");
    await page.addScriptTag({ content: inlineConsentScript });
    const tab2 = await context.newPage();
    try {
      await page.evaluate(() => (window as any).__royalMeasurementConsent.update({
        version: 1, analytics: false, marketing: true,
      }));
      await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey))
        .not.toBeNull();

      await tab2.goto("/lp/reforma-rj");
      await tab2.addScriptTag({ content: inlineConsentScript });
      expect(await tab2.evaluate(() => (window as any).__royalMeasurementConsent.get().marketing))
        .toBe(true);

      // Revocation on tab 2 must invalidate consent and attributed data in
      // the original tab without refresh, navigation or another grant.
      await tab2.evaluate(() => (window as any).__royalMeasurementConsent.update({
        version: 1, analytics: false, marketing: false,
      }));

      await expect.poll(() => page.evaluate(() =>
        (window as any).__royalMeasurementConsent.get()?.marketing,
      )).toBe(false);
      await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey))
        .toBeNull();

      await page.locator("#vazamento-nome").fill("Pessoa Teste");
      await page.locator("#vazamento-telefone").fill("21987654321");
      await page.locator("#vazamento-cidade").fill("Rio de Janeiro");
      await page.locator("#vazamento-consentimento").check();
      await page.locator("[data-vazamento-intake-form] [data-submit-btn]").click();

      await expect.poll(() => payloads.length).toBe(1);
      expect(payloads[0]).not.toHaveProperty("attribution");
      expect(await page.evaluate(() =>
        (window as any).__royalMeasurementConsent.get()?.marketing,
      )).toBe(false);
      expect(await page.evaluate(key => localStorage.getItem(key), storageKey))
        .toBeNull();
    } finally {
      await tab2.close();
    }
  });

  test("two tabs: clearing consent storage revokes permission and GTM flags in the first tab", async ({ page, context }) => {
    await context.route("https://www.googletagmanager.com/**", route =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    await page.goto("/lp/fibra-rj?utm_source=google&utm_medium=cpc&utm_campaign=clear_storage");
    await page.addScriptTag({ content: inlineConsentScript });
    await page.evaluate(() => (window as any).__royalMeasurementConsent.update({
      version: 1, analytics: true, marketing: true,
    }));
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey))
      .not.toBeNull();
    const tab2 = await context.newPage();
    try {
      await tab2.goto("/lp/reforma-rj");
      await tab2.evaluate(() => localStorage.removeItem("royal_measurement_consent.v1"));
      await expect.poll(() => page.evaluate(() =>
        (window as any).__royalMeasurementConsent.get(),
      )).toBeNull();
      await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey))
        .toBeNull();
      const deniedEvent = await page.evaluate(() => (window as any).dataLayer
        .filter((entry: any) => entry?.event === "royal_measurement_consent").at(-1));
      expect(deniedEvent).toMatchObject({
        analytics_consent: false, marketing_consent: false,
      });
    } finally {
      await tab2.close();
    }
  });

});

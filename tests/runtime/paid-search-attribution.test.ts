import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  GROWTH_FIRST_TOUCH_STORAGE_KEY,
  createBrowserGrowthAttributionRuntime,
  observeFirstTouch,
  observeSubmissionTouch,
} from "../../src/growth/attribution.ts";

const NOW = new Date("2026-10-14T15:00:00.000Z");

const urlFor = (medium: string, extra = "") =>
  new URL(
    `https://www.royalsplash.com.br/lp/fibra-rj?utm_source=google&utm_medium=${medium}&utm_campaign=fibra_rj${extra}`,
  );

describe("P0 paid search UTM normalization", () => {
  for (const medium of ["cpc", "CPC", "ppc", "paid_search"]) {
    it(`normalizes ${medium} to the Atlas paid_search contract`, () => {
      const url = urlFor(medium);
      const first = observeFirstTouch({ url, now: NOW });
      const submission = observeSubmissionTouch(url);

      expect(first).toMatchObject({
        source: "google",
        medium: "paid_search",
        campaignRef: "fibra_rj",
        landingPageRef: "/lp/fibra-rj",
      });
      expect(submission).toMatchObject({
        source: "google",
        medium: "paid_search",
        campaignRef: "fibra_rj",
        pageRef: "/lp/fibra-rj",
      });
    });
  }

  it("does not change nonpaid or unknown media", () => {
    expect(observeFirstTouch({ url: urlFor("organic_search"), now: NOW }).medium)
      .toBe("organic_search");
    expect(observeFirstTouch({ url: urlFor("unrecognized"), now: NOW }).medium)
      .toBeUndefined();
  });

  it("persists canonical attribution without leaking Google click IDs", () => {
    const records = new Map<string, string>();
    const storage = {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => { records.set(key, value); },
    };
    const runtime = createBrowserGrowthAttributionRuntime(storage);
    const url = urlFor(
      "cpc",
      "&gclid=TEST-CONSENT-PENDING&gbraid=TEST-BRAID&wbraid=TEST-WBRAID",
    );

    runtime.observe({ url, now: NOW });
    const stored = runtime.persistAfterConsent(NOW);

    expect(stored?.medium).toBe("paid_search");
    expect(stored?.campaignRef).toBe("fibra_rj");
    const serialized = records.get(GROWTH_FIRST_TOUCH_STORAGE_KEY) ?? "";
    expect(serialized).not.toContain("TEST-CONSENT-PENDING");
    expect(serialized).not.toContain("TEST-BRAID");
    expect(serialized).not.toContain("TEST-WBRAID");
  });
  it("preserves consented first touch across a new page runtime", () => {
    const records = new Map<string, string>();
    const storage = {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => { records.set(key, value); },
    };
    const entry = createBrowserGrowthAttributionRuntime(storage);
    entry.observe({ url: urlFor("CPC"), now: NOW });

    // Observation alone cannot persist information before authorization.
    expect(records.size).toBe(0);
    entry.persistAfterConsent(NOW);

    const laterPage = createBrowserGrowthAttributionRuntime(storage);
    laterPage.observe({
      url: new URL("https://www.royalsplash.com.br/inicie-seu-projeto"),
      now: new Date(NOW.getTime() + 60_000),
    });

    expect(laterPage.readPersisted(new Date(NOW.getTime() + 60_000)))
      .toMatchObject({
        source: "google",
        medium: "paid_search",
        campaignRef: "fibra_rj",
        landingPageRef: "/lp/fibra-rj",
      });

    // Later internal navigation cannot overwrite the saved first touch.
    laterPage.persistAfterConsent(new Date(NOW.getTime() + 60_000));
    expect(JSON.parse(records.get(GROWTH_FIRST_TOUCH_STORAGE_KEY) ?? "{}")
      .firstTouch.landingPageRef).toBe("/lp/fibra-rj");
  });

  it("wires persistent navigation attribution only to Marketing consent", () => {
    const component = readFileSync(
      new URL("../../src/components/runtime/GrowthAttribution.astro", import.meta.url),
      "utf8",
    );
    expect(component).toContain('"royal:measurement-consent-changed"');
    expect(component).toContain("choice?.marketing === true");
    expect(component).toContain("runtime.persistAfterConsent()");
    expect(component).toContain("observeCurrentPage();");
  });

});

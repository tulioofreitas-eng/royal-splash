import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("GTM bootstrap establishes explicit consent before container loading", async () => {
  const source = await read(
    "../../src/components/GTMHead.astro",
  );

  for (const consentType of [
    "analytics_storage",
    "ad_storage",
    "ad_user_data",
    "ad_personalization",
  ]) {
    assert.match(source, new RegExp(consentType));
  }

  const defaultCall = source.indexOf(
    '"default",\n        googleConsentState(storedChoice)',
  );
  const startupLoad = source.lastIndexOf(
    "if (shouldLoadContainer(storedChoice))",
  );

  assert.notEqual(defaultCall, -1);
  assert.notEqual(startupLoad, -1);
  assert.ok(defaultCall < startupLoad);
});

test("strict/basic mode does not expose a noscript GTM bypass", async () => {
  const source = await read(
    "../../src/components/GTMBody.astro",
  );

  assert.match(
    source,
    /MeasurementConsentBanner/,
  );
  assert.doesNotMatch(
    source,
    /googletagmanager\.com\/ns\.html/i,
  );
});

test("measurement banner exposes independent analytics and marketing choices", async () => {
  const source = await read(
    "../../src/components/runtime/MeasurementConsentBanner.astro",
  );

  assert.match(source, /data-consent-analytics/);
  assert.match(source, /data-consent-marketing/);
  assert.match(source, /data-consent-accept-all/);
  assert.match(source, /data-consent-reject-all/);
  assert.match(source, /data-consent-save/);
  assert.match(
    source,
    /O envio de uma solicitação funciona independentemente desta escolha/,
  );
});

test("production GTM intake delivery requires marketing consent when runtime exists", async () => {
  const source = await read(
    "../../src/growth/emitIntakeCreatedOnce.ts",
  );

  assert.match(
    source,
    /runtime\.get\?\.\(\)\?\.marketing === true/,
  );
  assert.match(
    source,
    /royal:intake-created/,
  );
  assert.match(
    source,
    /event: "intake_created"/,
  );
});


test("GTM bootstrap exposes an explicit category event for tag-level routing", async () => {
  const source = await read(
    "../../src/components/GTMHead.astro",
  );

  assert.match(
    source,
    /event:\s*"royal_measurement_consent"/,
  );
  assert.match(
    source,
    /analytics_consent:\s*choice\.analytics === true/,
  );
  assert.match(
    source,
    /marketing_consent:\s*choice\.marketing === true/,
  );

  const loadIndex = source.indexOf(
    "loadContainer();\n            pushConsentCategoryEvent(choice);",
  );

  assert.notEqual(
    loadIndex,
    -1,
    "container must be queued before the category event so GTM can route category-specific tags",
  );
});

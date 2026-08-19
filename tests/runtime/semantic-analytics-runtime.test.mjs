import assert from "node:assert/strict";
import {
  readFile,
} from "node:fs/promises";
import test from "node:test";

const runtimeSource =
  await readFile(
    new URL(
      "../../src/analytics/browser-runtime.ts",
      import.meta.url,
    ),
    "utf8",
  );

const installerSource =
  await readFile(
    new URL(
      "../../src/components/runtime/SemanticAnalytics.astro",
      import.meta.url,
    ),
    "utf8",
  );

test("semantic analytics browser runtime uses site-analytics.v1 without external delivery", () => {
  assert.match(
    runtimeSource,
    /SITE_ANALYTICS_SCHEMA_VERSION/,
  );

  assert.match(
    runtimeSource,
    /page_viewed/,
  );

  assert.match(
    runtimeSource,
    /cta_activated/,
  );

  assert.match(
    runtimeSource,
    /lead_submitted/,
  );

  assert.doesNotMatch(
    runtimeSource,
    /fetch\s*\(/,
  );

  assert.doesNotMatch(
    runtimeSource,
    /sendBeacon/,
  );

  assert.doesNotMatch(
    runtimeSource,
    /dataLayer|gtag|GTM|GA4/,
  );

  assert.doesNotMatch(
    runtimeSource,
    /localStorage|sessionStorage|document\.cookie/,
  );
});

test("semantic analytics installer is disabled in Production", () => {
  assert.match(
    installerSource,
    /getCurrentEnvironmentContract/,
  );

  assert.match(
    installerSource,
    /!environment\.isProduction/,
  );

  assert.match(
    installerSource,
    /data-semantic-analytics-runtime/,
  );
});

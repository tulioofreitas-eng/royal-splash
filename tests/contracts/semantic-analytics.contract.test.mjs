import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SITE_ANALYTICS_EVENT_NAMES,
  SITE_ANALYTICS_SCHEMA_VERSION,
} from "../../src/analytics/index.ts";

test("site analytics contract has an explicit schema version", () => {
  assert.equal(
    SITE_ANALYTICS_SCHEMA_VERSION,
    "site-analytics.v1",
  );
});

test("semantic event vocabulary describes user and site meaning, not providers", () => {
  assert.deepEqual(
    [...SITE_ANALYTICS_EVENT_NAMES],
    [
      "page_viewed",
      "cta_activated",
      "lead_submitted",
    ],
  );
});

test("analytics context identifies the site surface without owning rendering", async () => {
  const source = await readFile(
    new URL(
      "../../src/analytics/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteAnalyticsContext\s*{/,
  );

  assert.match(source, /\bpageRef:\s*string;/);
  assert.match(source, /\broute\?:\s*string;/);
  assert.match(source, /\btemplateRef\?:\s*string;/);
  assert.match(source, /\bcomponentRef\?:\s*string;/);
});

test("semantic event keeps event identity and optional channel references explicit", async () => {
  const source = await readFile(
    new URL(
      "../../src/analytics/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteAnalyticsEvent\s*{/,
  );

  assert.match(
    source,
    /\bschemaVersion:\s*typeof SITE_ANALYTICS_SCHEMA_VERSION;/,
  );

  assert.match(
    source,
    /\beventName:\s*SiteAnalyticsEventName;/,
  );

  assert.match(
    source,
    /\bcontext:\s*SiteAnalyticsContext;/,
  );

  assert.match(source, /\bsubjectRef\?:\s*string;/);
  assert.match(source, /\bchannelRef\?:\s*string;/);
  assert.match(source, /\bcampaignRef\?:\s*string;/);
});

test("analytics port defines delivery without selecting a provider", async () => {
  const source = await readFile(
    new URL(
      "../../src/analytics/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteAnalyticsPort\s*{/,
  );

  assert.match(
    source,
    /\btrack\(event:\s*SiteAnalyticsEvent\):\s*Promise<void>;/,
  );
});

test("semantic analytics contract excludes providers, runtime and lead PII", async () => {
  const source = await readFile(
    new URL(
      "../../src/analytics/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(executableSource, /dataLayer/i);
  assert.doesNotMatch(executableSource, /\bgtag\b/i);
  assert.doesNotMatch(executableSource, /\bgtm\b/i);
  assert.doesNotMatch(executableSource, /\bga4\b/i);
  assert.doesNotMatch(executableSource, /googletagmanager/i);
  assert.doesNotMatch(executableSource, /supabase/i);
  assert.doesNotMatch(executableSource, /formspree/i);
  assert.doesNotMatch(executableSource, /\batlas\b/i);
  assert.doesNotMatch(executableSource, /\bfetch\s*\(/i);
  assert.doesNotMatch(executableSource, /process\.env/i);
  assert.doesNotMatch(executableSource, /import\.meta\.env/i);

  assert.doesNotMatch(executableSource, /\bemail\??:\s*string/i);
  assert.doesNotMatch(executableSource, /\bphone\??:\s*string/i);
  assert.doesNotMatch(executableSource, /\btelefone\??:\s*string/i);
  assert.doesNotMatch(executableSource, /\bnome\??:\s*string/i);
  assert.doesNotMatch(executableSource, /\bmessage\??:\s*string/i);
  assert.doesNotMatch(executableSource, /\bmensagem\??:\s*string/i);

  assert.doesNotMatch(
    executableSource,
    /from\s+["'][^"']*astro[^"']*["']/i,
  );
});

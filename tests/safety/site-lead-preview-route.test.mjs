import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL(
    "../../src/pages/api/site-lead-preview.ts",
    import.meta.url,
  ),
  "utf8",
);

test("Preview lead ingress is explicitly production-blocked and uses the in-memory adapter", () => {
  assert.match(
    source,
    /getCurrentEnvironmentContract/,
  );

  assert.match(
    source,
    /environment\.isProduction/,
  );

  assert.match(
    source,
    /InMemoryLeadIngressAdapter/,
  );

  assert.match(
    source,
    /SITE_LEAD_SCHEMA_VERSION/,
  );
});

test("Preview lead ingress has no Production provider coupling", () => {
  assert.doesNotMatch(
    source,
    /createProductionSupabaseClient/,
  );

  assert.doesNotMatch(
    source,
    /resolveLeadProvider/,
  );

  assert.doesNotMatch(
    source,
    /ATLAS_INGRESS_TOKEN/,
  );

  assert.doesNotMatch(
    source,
    /SUPABASE_/,
  );
});

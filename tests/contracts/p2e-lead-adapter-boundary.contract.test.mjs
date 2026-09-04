import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SITE_LEAD_SCHEMA_VERSION } from "../../src/domains/leads/index.ts";
import { InMemoryLeadIngressAdapter } from "../../src/integrations/leads/in-memory.ts";

const sourceUrls = {
  contracts: new URL("../../src/domains/leads/contracts.ts", import.meta.url),
  intake: new URL("../../src/components/site/StructuredIntake.astro", import.meta.url),
  preview: new URL("../../src/pages/api/site-lead-preview.ts", import.meta.url),
  legacy: new URL("../../src/pages/api/lead.ts", import.meta.url),
  adapter: new URL("../../src/integrations/leads/in-memory.ts", import.meta.url),
};

const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceUrls).map(async ([name, url]) => [
      name,
      await readFile(url, "utf8"),
    ]),
  ),
);

function executableSource(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function importedSpecifiers(source) {
  return [...source.matchAll(/\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g)]
    .map((match) => match[1]);
}

const providerMarkers =
  /supabase|atlas|formspree|starterfunnels|leadconnector|msgsndr|ghl|EMPRESA_ID|SUPABASE_[A-Z_]+|ATLAS_[A-Z_]+/i;

test("WP3 target path is bound only to normalized Preview ingress", () => {
  const intake = executableSource(sources.intake);
  const actions = [...intake.matchAll(/\baction\s*=\s*["']([^"']+)["']/g)]
    .map((match) => match[1]);
  const fetchTargets = [...intake.matchAll(/\bfetch\s*\(\s*["']([^"']+)["']/g)]
    .map((match) => match[1]);

  assert.deepEqual(actions, ["/api/site-lead-preview"]);
  assert.deepEqual(fetchTargets, ["/api/site-lead-preview"]);
  assert.doesNotMatch(intake, /["']\/api\/lead["']/);

  assert.match(sources.preview, /type\s+SiteLeadRequestPayload/);
  assert.match(
    sources.preview,
    /const\s+lead\s*=\s*normalizeSiteLeadRequest\(body\)/,
  );
  assert.match(sources.preview, /new\s+InMemoryLeadIngressAdapter\s*\(\s*\)/);
  assert.match(sources.preview, /await\s+adapter\.submit\s*\(\s*lead\s*\)/);
});

test("normalized domain, port and in-memory adapter keep the provider boundary", async () => {
  assert.equal(SITE_LEAD_SCHEMA_VERSION, "site-lead.v1");
  assert.match(sources.contracts, /export interface SiteLeadIngress\s*{/);
  assert.match(
    sources.contracts,
    /export interface SiteLeadIngressPort\s*{[\s\S]*?submit\(lead:\s*SiteLeadIngress\):\s*Promise<void>;/,
  );
  assert.match(sources.adapter, /implements\s+SiteLeadIngressPort/);
  assert.match(sources.adapter, /submit\(lead:\s*SiteLeadIngress\):\s*Promise<void>/);

  const lead = {
    schemaVersion: SITE_LEAD_SCHEMA_VERSION,
    submissionRef: "site.12345678-1234-4123-8123-123456789abc",
    contact: { name: "Boundary fixture", email: "boundary@example.com" },
    interest: { description: "Normalized fixture" },
    acquisition: { ingressChannel: "site_form" },
    consent: { state: "granted" },
  };
  const adapter = new InMemoryLeadIngressAdapter();
  await adapter.submit(lead);
  assert.deepEqual(adapter.getSubmittedLeads(), [lead]);

  for (const [label, source] of [
    ["domain", sources.contracts],
    ["adapter", sources.adapter],
  ]) {
    const executable = executableSource(source);
    assert.doesNotMatch(executable, providerMarkers, `${label} contains a provider marker`);
    assert.doesNotMatch(executable, /\bfetch\s*\(/, `${label} owns networking`);
    assert.doesNotMatch(executable, /from\s+["'][^"']*astro[^"']*["']/i);
  }

  assert.deepEqual(importedSpecifiers(sources.adapter), [
    "../../domains/leads/contracts.ts",
  ]);
  assert.doesNotMatch(executableSource(sources.adapter), /normaliz/i);
});

test("Preview constructs normalized ingress without initializing a provider", () => {
  const preview = executableSource(sources.preview);
  const imports = importedSpecifiers(preview);

  assert.ok(imports.includes("../../domains/leads/contracts.ts"));
  assert.ok(imports.includes("../../integrations/leads/in-memory.ts"));
  assert.ok(imports.includes("../../safety/runtime.ts"));
  assert.ok(!imports.some((specifier) => /production-supabase|lead-provider/i.test(specifier)));

  assert.doesNotMatch(preview, /createProductionSupabaseClient|resolveLeadProvider/);
  assert.doesNotMatch(preview, providerMarkers);
  assert.match(preview, /getCurrentEnvironmentContract\s*\(\s*\)/);
  assert.match(
    preview,
    /if\s*\(\s*environment\.isProduction\s*\)\s*{[\s\S]*?status:\s*404/,
  );
});

test("legacy /api/lead remains direct persistence, not a SiteLeadIngressPort adapter", () => {
  const legacy = executableSource(sources.legacy);
  const imports = importedSpecifiers(legacy);

  assert.match(legacy, /let\s+campos:\s*Record<string,\s*string>\s*=\s*{/);
  assert.match(legacy, /resolveLeadProvider\s*\(/);
  assert.match(
    legacy,
    /await\s+import\(["']\.\.\/\.\.\/safety\/production-supabase\.ts["']\)/,
  );
  assert.match(legacy, /supabase\.from\(["']leads["']\)\.insert\s*\(/);

  assert.ok(!imports.some((specifier) => /domains\/leads|integrations\/leads\/in-memory/.test(specifier)));
  assert.doesNotMatch(
    legacy,
    /SiteLeadIngress(?:Port)?|InMemoryLeadIngressAdapter/,
  );
});

test("target flow has no dependency on the legacy /api/lead route", () => {
  for (const [label, source] of [
    ["intake", sources.intake],
    ["preview", sources.preview],
    ["domain", sources.contracts],
    ["adapter", sources.adapter],
  ]) {
    assert.doesNotMatch(
      executableSource(source),
      /["']\/api\/lead["']|pages\/api\/lead/,
      `${label} depends on the legacy lead endpoint`,
    );
  }
});

test("WP3 boundary sources match the controlled WP2B materialization fingerprints", () => {
  const controlledWp2bSha256 = {
    contracts: "9217622dd11494b6857a90a2759c4cfdebba9a4767c04ee4e149522442a571ea",
    intake: "f4fa2c93a28bdb307530374885c17078eb56a1f08850d6410938067b5e2b4ce1",
    preview: "84d272e897b11ab262218f267db4a72941df7941e00c019e64033d10e2daa1d9",
    legacy: "e319eb440bf41ff668e3836a321d0535844ce8cbb20cf0df8db1d18137852230",
  };

  for (const [name, expected] of Object.entries(controlledWp2bSha256)) {
    const actual = createHash("sha256").update(sources[name]).digest("hex");
    assert.equal(actual, expected, `${name} drifted from the controlled WP2B state`);
  }
});

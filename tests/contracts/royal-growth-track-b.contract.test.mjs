import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("both approved layouts own only nonvisual Growth runtime wiring", async () => {
  const [site, landing, growthRuntime] = await Promise.all([
    read("src/layouts/SiteLayout.astro"),
    read("src/layouts/LandingLayout.astro"),
    read("src/components/runtime/GrowthAttribution.astro"),
  ]);

  for (const layout of [site, landing]) {
    assert.match(layout, /<GrowthAttribution\s*\/>/);
    assert.match(layout, /<WhatsAppClickAnalytics\s*\/>/);
  }

  assert.match(growthRuntime, /<script>/);
  assert.doesNotMatch(growthRuntime, /<style>|<div|<section|<aside/);
});

test("ProjectStartForm confirms a strict receipt and keeps one logical submission reference", async () => {
  const source = await read("src/components/site/ProjectStartForm.astro");

  assert.equal(source.split('fetch("/api/site-lead"').length - 1, 1);
  assert.equal(source.split("crypto.randomUUID()").length - 1, 1);
  assert.match(source, /composedSubmission\.fingerprint !== fingerprint/);
  assert.match(source, /typeof caseId !== "string"/);
  assert.match(source, /typeof replay !== "boolean"/);
  assert.match(source, /controller\.abort\(\), 8_000/);
  assert.match(source, /persistentWhatsApp\.href = whatsappUrl/);
  assert.ok(
    source.indexOf("persistAfterConsent(now)") <
      source.indexOf("const logicalSubmission"),
  );
  assert.ok(
    source.indexOf('new CustomEvent("site:lead-submitted"') >
      source.indexOf('typeof caseId !== "string"'),
  );
});

test("anonymous WhatsApp analytics remains non-Lead, non-Intake, and PII-free", async () => {
  const source = await read(
    "src/components/runtime/WhatsAppClickAnalytics.astro",
  );

  assert.match(source, /fetch\("\/api\/whatsapp-click"/);
  assert.doesNotMatch(source, /\/api\/site-lead|\/api\/lead/);
  assert.doesNotMatch(source, /lead_submitted|caseId/);
  assert.doesNotMatch(
    source,
    /\b(nome|name|email|phone|telefone|cidade|city)\b/i,
  );
  assert.match(source, /window\.location\.pathname/);
});

test("seven active LP handoffs remain WhatsApp-only and non-Lead", async () => {
  const paths = [
    "CorporativoWhatsAppForm.astro",
    "FibraWhatsAppForm.astro",
    "LazerWhatsAppForm.astro",
    "PiscinasWhatsAppForm.astro",
    "ReformaWhatsAppForm.astro",
    "SaunaWhatsAppForm.astro",
    "VazamentoWhatsAppForm.astro",
  ].map((file) => `src/components/lp/${file}`);

  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /site:whatsapp-handoff-initiated/);
    assert.doesNotMatch(source, /\/api\/site-lead|lead_submitted/);
  }
});

test("legacy ingress and held route are not imported by Track B", async () => {
  const trackBPaths = [
    "src/growth/attribution.ts",
    "src/components/runtime/GrowthAttribution.astro",
    "src/components/runtime/WhatsAppClickAnalytics.astro",
    "src/integrations/leads/atlas-site-origin-payload.ts",
    "src/integrations/leads/atlas-site-origin.ts",
    "src/pages/api/site-lead.ts",
    "src/components/site/ProjectStartForm.astro",
  ];
  const combined = (await Promise.all(trackBPaths.map(read))).join("\n");

  assert.doesNotMatch(combined, /FormularioGHL|reparo-subaquatico/);
  assert.doesNotMatch(combined, /["']\/api\/lead["']/);
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sources = Object.fromEntries(await Promise.all(
  Object.entries({
    contact: "src/pages/contato.astro",
    form: "src/components/Formulario.astro",
    intake: "src/components/site/StructuredIntake.astro",
    thankYou: "src/pages/obrigado.astro",
    preview: "src/pages/api/site-lead-preview.ts",
    legacyLead: "src/pages/api/lead.ts",
    contracts: "src/domains/leads/contracts.ts",
    adapter: "src/integrations/leads/in-memory.ts",
  }).map(async ([name, file]) => [name, await readFile(file, "utf8")]),
));

const executableSource = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

test("/contato is auxiliary and routes project initiation to StructuredIntake", () => {
  assert.doesNotMatch(sources.contact, /import\s+Formulario\b/);
  assert.doesNotMatch(sources.contact, /<Formulario\b/);
  assert.match(sources.contact, /href=["']\/inicie-seu-projeto["']/);
  assert.doesNotMatch(sources.contact, /["']\/api\/lead["']/);
  assert.doesNotMatch(sources.contact, /formspree/i);
  assert.doesNotMatch(sources.contact, /<form\b|data-lead-form/);

  for (const destination of [
    "https://instagram.com/royalsplashoficial",
    "https://wa.me/5521982590643",
    "tel:+5521982590643",
    "mailto:contato@royalsplash.com.br",
  ]) assert.ok(sources.contact.includes(destination), `missing contact destination: ${destination}`);
});

test("StructuredIntake retains Preview-only endpoint and inline completion", () => {
  const intake = executableSource(sources.intake);
  assert.deepEqual(
    [...intake.matchAll(/\baction\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]),
    ["/api/site-lead-preview"],
  );
  assert.deepEqual(
    [...intake.matchAll(/\bfetch\s*\(\s*["']([^"']+)["']/g)].map((match) => match[1]),
    ["/api/site-lead-preview"],
  );
  assert.match(intake, /role=["']status["']/);
  assert.match(intake, /form\.hidden\s*=\s*true/);
  assert.match(intake, /success\.hidden\s*=\s*false/);
  assert.match(intake, /success\.focus\s*\(\s*\)/);
  assert.doesNotMatch(intake, /\/obrigado|\/api\/lead/);
});

test("legacy completion and direct persistence remain isolated compatibility surfaces", () => {
  assert.match(sources.thankYou, /fetch\(["']\/api\/lead["']/);
  assert.match(sources.legacyLead, /supabase\.from\(["']leads["']\)\.insert/);
  assert.doesNotMatch(sources.legacyLead, /SiteLeadIngress(?:Port)?|InMemoryLeadIngressAdapter/);
  assert.doesNotMatch(sources.adapter, /pages\/api\/lead|["']\/api\/lead["']/);
  assert.match(sources.contracts, /SITE_LEAD_SCHEMA_VERSION\s*=\s*["']site-lead\.v1["']/);
  assert.match(sources.contracts, /export interface SiteLeadIngressPort/);
});

test("protected H2 boundary preserves controlled base fingerprints", () => {
  const expected = {
    form: "9890eb8f89995198152822fe68ab684f94aba1e07f855acd6e044232a82082c0",
    intake: "f4fa2c93a28bdb307530374885c17078eb56a1f08850d6410938067b5e2b4ce1",
    thankYou: "0bddc29e8db85ab0c1d47ec84afaab810ccd805f4b04acad335266dd7962f5c6",
    preview: "84d272e897b11ab262218f267db4a72941df7941e00c019e64033d10e2daa1d9",
    legacyLead: "e319eb440bf41ff668e3836a321d0535844ce8cbb20cf0df8db1d18137852230",
    contracts: "2818320dc0c1bdf0feb3d95cf7036acdcac5bc26e87d20b9a7f28eac4d7b97ca",
    adapter: "757c59fcd4af2d48a0dba04df20332ebb45308b58e73c0f27373daf0f5b83962",
  };

  for (const [name, fingerprint] of Object.entries(expected)) {
    assert.equal(createHash("sha256").update(sources[name]).digest("hex"), fingerprint, `${name} drifted`);
  }
});

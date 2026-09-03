import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  AtlasSiteOriginConfigError,
  createAtlasSiteOriginConfig,
} from "../../src/safety/atlas-site-origin-config.ts";

const adapterPath = "src/integrations/leads/atlas-site-origin.ts";
const configPath = "src/safety/atlas-site-origin-config.ts";
const routePath = "src/pages/api/site-lead.ts";

test("Atlas configuration is Production-only and has no secret-bearing errors", () => {
  const secret = "must-never-leak";

  assert.throws(
    () =>
      createAtlasSiteOriginConfig(
        { isProduction: false },
        {
          ATLAS_SITE_ORIGIN_URL: "https://atlas.example",
          ATLAS_INGRESS_TOKEN: secret,
        },
      ),
    (error) => {
      assert.equal(error instanceof AtlasSiteOriginConfigError, true);
      assert.equal(error.message.includes(secret), false);
      return true;
    },
  );

  assert.throws(
    () =>
      createAtlasSiteOriginConfig(
        { isProduction: true },
        {
          ATLAS_SITE_ORIGIN_URL: "not-a-url-with-secret-must-never-leak",
          ATLAS_INGRESS_TOKEN: secret,
        },
      ),
    (error) => {
      assert.equal(error.message.includes(secret), false);
      assert.equal(error.message.includes("not-a-url-with-secret"), false);
      return true;
    },
  );
});

test("Atlas configuration creates the exact server endpoint without PUBLIC variables", async () => {
  const config = createAtlasSiteOriginConfig(
    { isProduction: true },
    {
      ATLAS_SITE_ORIGIN_URL: "https://atlas.example/",
      ATLAS_INGRESS_TOKEN: "test-token",
    },
  );
  const source = await readFile(configPath, "utf8");

  assert.equal(
    config.endpoint,
    "https://atlas.example/api/intake/site-origin",
  );
  assert.equal(config.timeoutMs, 8_000);
  assert.equal(config.maxRetryDelayMs, 1_000);
  assert.doesNotMatch(source, /PUBLIC_/);
});

test("adapter has no Supabase, legacy tenant, environment, or credential reads", async () => {
  const source = await readFile(adapterPath, "utf8");

  assert.doesNotMatch(source, /supabase|EMPRESA_ID|empresaId|tenantId/i);
  assert.doesNotMatch(
    source,
    /process\.env|import\.meta\.env|\bPUBLIC_[A-Z]/,
  );
  assert.doesNotMatch(source, /ATLAS_INGRESS_TOKEN|ATLAS_SITE_ORIGIN_URL/);
});

test("Production route resolves mock before lazily reading Production config", async () => {
  const source = await readFile(routePath, "utf8");
  const mockFactory = source.indexOf(
    "mock: () => new InMemoryLeadIngressAdapter()",
  );
  const productionConfig = source.indexOf(
    "getAtlasSiteOriginConfig(environment)",
  );

  assert.match(source, /resolveLeadProvider\(environment/);
  assert.ok(mockFactory >= 0);
  assert.ok(productionConfig > mockFactory);
  assert.doesNotMatch(source, /supabase|EMPRESA_ID|empresaId|tenantId/i);
  assert.doesNotMatch(source, /console\.|JSON\.stringify\(lead\)/);
});

test("Preview route remains Atlas-credential-free and mock-only", async () => {
  const source = await readFile(
    "src/pages/api/site-lead-preview.ts",
    "utf8",
  );

  assert.match(source, /InMemoryLeadIngressAdapter/);
  assert.doesNotMatch(
    source,
    /AtlasSiteOrigin|ATLAS_SITE_ORIGIN_URL|ATLAS_INGRESS_TOKEN/,
  );
});

test("live WhatsApp forms and current project-start surface remain unwired", async () => {
  const paths = [
    "src/components/lp/CorporativoWhatsAppForm.astro",
    "src/components/lp/FibraWhatsAppForm.astro",
    "src/components/lp/LazerWhatsAppForm.astro",
    "src/components/lp/PiscinasWhatsAppForm.astro",
    "src/components/lp/ReformaWhatsAppForm.astro",
    "src/components/lp/SaunaWhatsAppForm.astro",
    "src/components/lp/VazamentoWhatsAppForm.astro",
  ];

  for (const path of paths) {
    const source = await readFile(path, "utf8");
    assert.match(source, /whatsapp|wa\.me/i, path);
    assert.doesNotMatch(
      source,
      /\/api\/site-lead(?:["'])|AtlasSiteOrigin|ATLAS_INGRESS_TOKEN/,
      path,
    );
  }

  const projectStartPage = await readFile(
    "src/pages/inicie-seu-projeto.astro",
    "utf8",
  );
  assert.match(projectStartPage, /<ProjectStartForm \/>/);
  assert.doesNotMatch(projectStartPage, /StructuredIntake/);
});

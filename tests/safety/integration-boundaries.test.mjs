import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(path, "utf8");
}

test("GTM components are gated by production analytics contract", () => {
  for (const path of [
    "src/components/GTMHead.astro",
    "src/components/GTMBody.astro",
  ]) {
    const source = read(path);

    assert.match(
      source,
      /getCurrentEnvironmentContract/,
      `${path} must use the runtime environment contract`,
    );

    assert.match(
      source,
      /allowProductionAnalytics/,
      `${path} must use the production analytics capability`,
    );

    assert.ok(
      source.indexOf("allowProductionAnalytics &&") <
        source.indexOf("GTM-TFW2WDRG"),
      `${path} must guard GTM before rendering the container`,
    );
  }
});

test("Formulario keeps Formspree behind production lead egress", () => {
  const source = read("src/components/Formulario.astro");

  assert.match(source, /getCurrentEnvironmentContract/);
  assert.match(source, /leadProvider === "production"/);
  assert.match(source, /data-production-lead-egress/);
  assert.match(source, /form\[data-lead-form="true"\]/);

  assert.ok(
    source.indexOf('leadProvider === "production"') <
      source.indexOf("https://formspree.io/"),
    "Formspree must be selected only after production lead classification",
  );

  assert.doesNotMatch(
    source,
    /form\[action\*=["']formspree["']\]/,
    "Form selection must not depend on the Production-only Formspree URL",
  );
});

test("GHL embed is gated by production lead egress", () => {
  const source = read("src/components/FormularioGHL.astro");

  assert.match(source, /getCurrentEnvironmentContract/);
  assert.match(source, /leadProvider === "production"/);
  assert.match(source, /allowProductionLeadEgress &&/);

  assert.ok(
    source.indexOf("allowProductionLeadEgress &&") <
      source.indexOf("link.starterfunnels.com"),
    "GHL resources must be behind the Production lead-egress guard",
  );
});

test("API routes choose provider before production Supabase initialization", () => {
  for (const path of [
    "src/pages/api/lead.ts",
    "src/pages/api/whatsapp-click.ts",
  ]) {
    const source = read(path);

    assert.match(source, /getCurrentEnvironmentContract/);
    assert.match(source, /resolveLeadProvider/);
    assert.match(source, /leadProvider === "mock"/);
    assert.match(
      source,
      /await import\("\.\.\/\.\.\/safety\/production-supabase\.ts"\)/,
    );

    assert.ok(
      source.indexOf('leadProvider === "mock"') <
        source.indexOf('await import("../../safety/production-supabase.ts")'),
      `${path} must resolve mock before loading Production persistence`,
    );

    assert.doesNotMatch(
      source,
      /@[Ss]upabase\/supabase-js|createClient/,
      `${path} must not initialize Supabase directly`,
    );
  }
});

test("Supabase client initialization is isolated to Production helper", () => {
  const helper = read("src/safety/production-supabase.ts");

  assert.match(helper, /createClient/);
  assert.match(helper, /SUPABASE_SERVICE_ROLE_KEY/);

  for (const path of [
    "src/pages/api/lead.ts",
    "src/pages/api/whatsapp-click.ts",
    "src/components/Formulario.astro",
    "src/components/FormularioGHL.astro",
    "src/components/GTMHead.astro",
    "src/components/GTMBody.astro",
  ]) {
    const source = read(path);

    assert.doesNotMatch(
      source,
      /@[Ss]upabase\/supabase-js|createClient/,
      `${path} must not own a Supabase client`,
    );
  }
});

test("whatsapp-click keeps Preview mock-only before Production persistence", () => {
  const source = read("src/pages/api/whatsapp-click.ts");

  const mockGuard = source.indexOf('leadProvider === "mock"');
  const productionImport = source.indexOf(
    'await import("../../safety/production-supabase.ts")',
  );

  assert.ok(mockGuard >= 0, "whatsapp-click must keep the mock provider guard");
  assert.ok(
    productionImport > mockGuard,
    "Production persistence must load only after the mock-only exit",
  );

  assert.match(
    source,
    /JSON\.stringify\(\{ ok: true, mock: true \}\)/,
    "non-Production must keep the explicit mock response",
  );

  const productionInitialization = source.indexOf(
    "createProductionSupabaseClient();",
  );

  assert.ok(
    productionInitialization > productionImport,
    "Production Supabase must initialize only after the lazy Production import",
  );

  assert.doesNotMatch(
    source.slice(0, productionImport),
    /createProductionSupabaseClient\(\)/,
    "Production Supabase must not initialize before the mock-only exit",
  );
});

test("whatsapp-click preserves pre-T1-S0 best-effort Production semantics", () => {
  const source = read("src/pages/api/whatsapp-click.ts");

  assert.match(
    source,
    /let pagina: string \| null = null;/,
    "pagina must default to null",
  );

  assert.match(
    source,
    /const corpo = await request\.json\(\);/,
    "request JSON parsing must remain inside the tolerant parsing block",
  );

  assert.match(
    source,
    /typeof corpo\?\.pagina === "string"/,
    "pagina must only accept string input",
  );

  assert.match(
    source,
    /corpo\.pagina\.slice\(0, 255\)/,
    "pagina must preserve the historical 255-character limit",
  );

  assert.match(
    source,
    /catch \{\s*\/\/ corpo vazio\/ inválido — segue sem página, não é motivo pra falhar\s*\}/,
    "malformed or empty JSON must remain non-fatal",
  );

  assert.match(
    source,
    /empresa_id: EMPRESA_ID,\s*pagina,/,
    "Production insert must preserve pagina as null when no valid page exists",
  );

  assert.doesNotMatch(
    source,
    /pagina:\s*String\(/,
    "pagina must not be coerced from null to an empty string",
  );

  assert.match(
    source,
    /if \(error\) \{[\s\S]*?console\.error\("Erro ao registrar clique:", error\);[\s\S]*?\}[\s\S]*?return new Response\(JSON\.stringify\(\{ ok: true \}\), \{ status: 200 \}\);/,
    "tracking failure must remain best-effort and return success",
  );

  const okResponses =
    source.match(
      /return new Response\(JSON\.stringify\(\{ ok: true \}\), \{ status: 200 \}\);/g,
    ) ?? [];

  assert.equal(
    okResponses.length,
    2,
    "normal Production path and outer failure path must both return HTTP 200",
  );

  assert.doesNotMatch(
    source,
    /status:\s*500/,
    "whatsapp-click must not return HTTP 500 for tracking failures",
  );

  assert.doesNotMatch(
    source,
    /JSON\.stringify\(\{ error:/,
    "whatsapp-click must not replace its best-effort success response with an error payload",
  );
});

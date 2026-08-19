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

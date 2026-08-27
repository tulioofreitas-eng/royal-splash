import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SEGMENT_CONTEXT = path.join(ROOT, "src/components/site/SegmentContextPage.astro");
const SERVICOS = path.join(ROOT, "src/pages/servicos.astro");
const CORPORATIVO = path.join(ROOT, "src/pages/corporativo.astro");

test("SegmentContextPage is the sole Brand activation point for both declarative wrappers", async () => {
  const [source, servicos, corporativo] = await Promise.all([
    readFile(SEGMENT_CONTEXT, "utf8"),
    readFile(SERVICOS, "utf8"),
    readFile(CORPORATIVO, "utf8"),
  ]);

  assert.match(source, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(source, /<SiteHeader[\s\S]*?visualMode=["']brand["']/);
  assert.match(source, /bodyClass=["'][^"']*site-primitive-page[^"']*["']/);

  assert.match(servicos, /<SegmentContextPage\s+[\s\S]*?context=["']residencial["'][\s\S]*?title=["']Residencial["'][\s\S]*?intro=["']Explore o contexto residencial, consulte Projetos e inicie seu projeto quando estiver pronto\.["']\s*\/>/);
  assert.match(corporativo, /<SegmentContextPage\s+[\s\S]*?context=["']corporativo_institucional["'][\s\S]*?title=["']Corporativo \/ Institucional["'][\s\S]*?intro=["']Explore o contexto corporativo ou institucional, consulte Projetos e inicie seu projeto quando estiver pronto\.["']\s*\/>/);

  for (const wrapper of [servicos, corporativo]) {
    assert.doesNotMatch(wrapper, /visualMode\s*=/);
    assert.doesNotMatch(wrapper, /site-primitive-/);
  }
});

test("SegmentContextPage adopts the complete existing P2B primitive vocabulary", async () => {
  const source = await readFile(SEGMENT_CONTEXT, "utf8");
  for (const primitive of [
    "site-primitive-page",
    "site-primitive-section",
    "site-primitive-section--entry",
    "site-primitive-eyebrow",
    "site-primitive-page-title",
    "site-primitive-section-title",
    "site-primitive-body",
    "site-primitive-supporting",
    "site-primitive-reading",
    "site-primitive-actions",
    "site-primitive-datum-top",
    "site-primitive-surface--dark",
    "site-primitive-action",
    "site-primitive-action--primary",
    "site-primitive-action--tertiary",
  ]) assert.ok(source.includes(primitive), `missing primitive: ${primitive}`);

  const conversion = source.match(
    /<section\b[^>]*segment-context--conversion[^>]*>[\s\S]*?<\/section>/,
  )?.[0];
  assert.ok(conversion);
  assert.match(conversion, /site-primitive-surface--dark/);
  assert.match(conversion, /site-primitive-action--primary/);
});

test("SegmentContextPage preserves context, conversion, analytics and link contracts", async () => {
  const source = await readFile(SEGMENT_CONTEXT, "utf8");
  assert.match(source, /type\s+SegmentContext\s*=\s*\|\s*["']residencial["']\s*\|\s*["']corporativo_institucional["']/);
  assert.match(source, /`\/inicie-seu-projeto\?context=\$\{encodeURIComponent\(context\)\}`/);
  assert.match(source, /data-analytics-subject=\{context\}/);
  assert.match(source, /data-analytics-component=["']segment_context["']/);
  assert.match(source, /data-analytics-channel=["']site_form["']/);
  assert.match(source, /data-segment-qualified-action/);
  for (const href of ["/projetos", "/metodo-royal", "/contato"]) {
    assert.match(source, new RegExp(`href=["']${href}["']`));
  }
});

test("SegmentContextPage stays inside consumer and local-composition boundaries", async () => {
  const source = await readFile(SEGMENT_CONTEXT, "utf8");
  assert.doesNotMatch(source, /import\s+["'][^"']*\/(?:brand-foundation|site-brand|site-primitives|site-system)\.css["']/);
  for (const forbidden of [
    "Poppins", "--color-marca", "--color-marca-suave", "--color-piscina",
    "--color-ouro", "--font-sans", "system-ui", "Canvas", "CanvasText",
  ]) assert.ok(!source.includes(forbidden), `must not reference ${forbidden}`);
  assert.doesNotMatch(source, /--brand-(?:color|font)-/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);

  for (const component of ["Button", "Card", "Section", "Surface", "Typography"]) {
    await assert.rejects(access(path.join(ROOT, `src/components/site/${component}.astro`)));
  }
});

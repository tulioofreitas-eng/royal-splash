import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const ABOUT_PAGE = path.join(ROOT, "src/pages/sobre.astro");
const PRIMITIVES_CSS = path.join(ROOT, "src/styles/site-primitives.css");

async function astroFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await astroFiles(entryPath));
    else if (entry.name.endsWith(".astro")) files.push(entryPath);
  }
  return files;
}

test("About receives shared styles through SiteLayout and keeps explicit Brand activation", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");
  assert.doesNotMatch(
    source,
    /import\s+["']\.\.\/styles\/(?:brand-foundation|site-brand|site-primitives|site-system)\.css["'];/,
  );
  assert.match(source, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(source, /<SiteHeader[\s\S]*?visualMode=["']brand["']/);
});

test("About adopts the shared page, typography, rhythm, surface, datum, and action APIs", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");
  for (const primitive of [
    "site-primitive-page",
    "site-primitive-page-title",
    "site-primitive-section-title",
    "site-primitive-subtitle",
    "site-primitive-body",
    "site-primitive-supporting",
    "site-primitive-eyebrow",
    "site-primitive-section",
    "site-primitive-section--entry",
    "site-primitive-reading",
    "site-primitive-actions",
    "site-primitive-datum-top",
    "site-primitive-surface--dark",
    "site-primitive-action",
    "site-primitive-action--primary",
    "site-primitive-action--tertiary",
  ]) {
    assert.ok(source.includes(primitive), `missing primitive adoption: ${primitive}`);
  }
  assert.match(source, /bodyClass=["'][^"']*site-primitive-page[^"']*["']/);
  const qualifiedAction = source.match(
    /<section\b[^>]*data-trust-stage=["']qualified-action["'][^>]*>[\s\S]*?<\/section>/,
  )?.[0];
  assert.ok(qualifiedAction);
  assert.match(qualifiedAction, /site-primitive-surface--dark/);
  assert.match(qualifiedAction, /site-primitive-action--primary/);
});

test("route-local CSS retains trust composition without duplicating shared baseline", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");
  const styles = [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1]).join("\n");
  assert.match(styles, /\.trust-grid\s*\{/);
  assert.match(styles, /grid-template-columns/);
  assert.match(styles, /\.trust-conversion\s*\{/);
  for (const declaration of [
    "font-family", "font-size", "font-weight", "line-height",
    "box-sizing", "background:", "color:", "max-width:",
  ]) {
    const property = declaration.replace(/:$/, "");
    assert.doesNotMatch(
      styles,
      new RegExp(`(^|[;{])\\s*${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`, "m"),
      `duplicated shared declaration: ${declaration}`,
    );
  }
  assert.doesNotMatch(styles, /body\.site-brand-about/);
});

test("trust composition remains route-local and consumer allowlists stay isolated", async () => {
  const primitives = await readFile(PRIMITIVES_CSS, "utf8");
  assert.doesNotMatch(primitives, /\.trust-/);

  const roots = ["src/pages", "src/layouts", "src/components"];
  const files = (await Promise.all(roots.map((root) => astroFiles(path.join(ROOT, root))))).flat();
  const brandConsumers = [];
  const primitiveConsumers = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(ROOT, file);
    if (/visualMode\s*=\s*["']brand["']/.test(source)) brandConsumers.push(relative);
    if (source.includes("site-primitive-")) primitiveConsumers.push(relative);
  }
  const authorizedConsumers = [
    "src/pages/metodo-royal.astro",
    "src/pages/sobre.astro",
    "src/components/site/SegmentContextPage.astro",
  ];
  assert.deepEqual(brandConsumers, authorizedConsumers);
  assert.deepEqual(primitiveConsumers, authorizedConsumers);
});

test("About preserves controlled content and implementation boundaries", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");
  const content = source.replace(/<style\b[\s\S]*?<\/style>/g, "");
  for (const forbidden of [
    "Poppins", "--color-marca", "--color-marca-suave", "--color-piscina",
    "--color-ouro", "--font-sans", "system-ui", "Canvas", "CanvasText",
  ]) assert.ok(!source.includes(forbidden), `must not reference ${forbidden}`);
  assert.doesNotMatch(source, /--brand-(?:color|font)-/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
  for (const claim of ["20+", "500+", "100%", "Rio de Janeiro", "Santa Catarina", "equipe própria"]) {
    assert.ok(!content.includes(claim), `unsupported claim found: ${claim}`);
  }
  for (const href of ["/projetos", "/metodo-royal", "/inicie-seu-projeto", "/contato"]) {
    assert.match(source, new RegExp(`href=["']${href}["']`));
  }
  for (const attribute of [
    "data-analytics-cta", 'data-analytics-component="royal_trust"',
    'data-analytics-subject="project_start"', 'data-analytics-channel="site_form"',
  ]) assert.ok(source.includes(attribute), `missing controlled attribute: ${attribute}`);
});

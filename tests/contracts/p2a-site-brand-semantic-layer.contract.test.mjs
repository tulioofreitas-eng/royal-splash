import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SITE_LAYOUT = path.join(ROOT, "src/layouts/SiteLayout.astro");
const SITE_SYSTEM_CSS = path.join(ROOT, "src/styles/site-system.css");
const SITE_BRAND_CSS = path.join(ROOT, "src/styles/site-brand.css");
const CONSUMER_ROOTS = ["src/pages", "src/layouts", "src/components"];
const BRAND_SELECTOR =
  'body:is([data-template-family="site"], [data-template-family="landing"])[data-site-visual="brand"]';

const semanticMappings = {
  "--site-color-page-background": "--brand-color-soft-background",
  "--site-color-surface": "--brand-color-white",
  "--site-color-surface-muted": "--brand-color-surface",
  "--site-color-surface-dark": "--brand-color-royal-dark",
  "--site-color-text-primary": "--site-a11y-text-primary-on-light",
  "--site-color-text-secondary": "--site-a11y-text-secondary-on-light",
  "--site-color-text-on-dark": "--site-a11y-text-primary-on-dark",
  "--site-color-accent-on-dark": "--site-a11y-text-accent-on-dark",
  "--site-color-divider": "--brand-color-line",
  "--site-color-required-boundary":
    "--site-a11y-required-ui-boundary-on-light",
  "--site-font-display": "--brand-font-display",
  "--site-font-text": "--brand-font-text",
  "--site-font-ui": "--brand-font-text",
  "--site-font-weight-display": "--brand-font-display-weight",
  "--site-font-weight-text": "--brand-font-text-weight-regular",
  "--site-font-weight-ui": "--brand-font-text-weight-medium",
  "--site-font-weight-ui-strong": "--brand-font-text-weight-semibold",
  "--site-font-weight-strong": "--brand-font-text-weight-bold",
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await sourceFiles(entryPath));
    } else if (/\.(astro|[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

test("SiteLayout reaches the inert Site Brand semantic layer through the Site entrypoint", async () => {
  const [layoutSource, systemCss, brandCss] = await Promise.all([
    readFile(SITE_LAYOUT, "utf8"),
    readFile(SITE_SYSTEM_CSS, "utf8"),
    readFile(SITE_BRAND_CSS, "utf8"),
  ]);

  assert.match(
    layoutSource,
    /import\s+["']\.\.\/styles\/site-system\.css["'];/,
  );
  assert.doesNotMatch(
    layoutSource,
    /import\s+["']\.\.\/styles\/site-brand\.css["'];/,
  );
  assert.match(systemCss, /@import\s+["']\.\/site-brand\.css["']\s*;/);
  assert.match(brandCss, new RegExp(escapeRegex(BRAND_SELECTOR)));
  assert.match(layoutSource, /visualMode\s*=\s*["']functional["']/);
});

test("Site Brand tokens are confined to the explicit Brand selector", async () => {
  const css = await readFile(SITE_BRAND_CSS, "utf8");
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...cssWithoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

  assert.equal(rules.length, 1);
  assert.equal(rules[0][1].trim(), BRAND_SELECTOR);
  assert.doesNotMatch(css, /:root\s*\{/);
});

test("semantic roles map only to approved Brand and accessibility primitives", async () => {
  const css = await readFile(SITE_BRAND_CSS, "utf8");

  for (const [semanticToken, primitiveToken] of Object.entries(
    semanticMappings,
  )) {
    assert.match(
      css,
      new RegExp(
        `${escapeRegex(semanticToken)}:\\s*var\\(\\s*${escapeRegex(primitiveToken)}\\s*\\)\\s*;`,
      ),
      `${semanticToken} must map to ${primitiveToken}`,
    );
  }

  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
});

test("Site Brand layer has no legacy dependencies", async () => {
  const css = await readFile(SITE_BRAND_CSS, "utf8");
  const forbidden = [
    "Poppins",
    "--color-marca",
    "--color-marca-suave",
    "--color-piscina",
    "--color-ouro",
    "--font-sans",
  ];

  for (const value of forbidden) {
    assert.ok(!css.includes(value), `must not reference ${value}`);
  }
});

test("Royal Gold remains restricted to the approved dark-surface accent", async () => {
  const css = await readFile(SITE_BRAND_CSS, "utf8");

  assert.match(
    css,
    /--site-color-accent-on-dark:\s*var\(\s*--site-a11y-text-accent-on-dark\s*\)\s*;/,
  );
  assert.doesNotMatch(css, /--brand-color-royal-gold/);
  assert.equal(
    (css.match(/var\(\s*--site-a11y-text-accent-on-dark\s*\)/g) ?? [])
      .length,
    1,
  );
});

test("only approved pages opt into Site Brand mode", async () => {
  const files = (
    await Promise.all(
      CONSUMER_ROOTS.map((directory) => sourceFiles(path.join(ROOT, directory))),
    )
  ).flat().filter((file) => file !== SITE_LAYOUT);

  const optIns = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");

    if (/visualMode\s*=\s*["']brand["']/.test(source)) {
      optIns.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(optIns.sort(), [
    "src/pages/index.astro",
    "src/pages/lp/fibra.astro",
    "src/pages/lp/corporativo.astro",
    "src/pages/lp/lazer.astro",
    "src/pages/lp/piscinas.astro",
    "src/pages/lp/reforma.astro",
    "src/pages/lp/sauna.astro",
    "src/pages/lp/vazamento.astro",
    "src/pages/inicie-seu-projeto.astro",
    "src/pages/metodo-royal.astro",
    "src/pages/projetos.astro",
    "src/pages/projetos/[slug].astro",
    "src/pages/sobre.astro",
    "src/components/site/SegmentContextPage.astro",
  ].sort());
});

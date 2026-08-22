import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SITE_LAYOUT = path.join(ROOT, "src/layouts/SiteLayout.astro");
const SITE_SYSTEM = path.join(ROOT, "src/styles/site-system.css");
const SITE_BRAND = path.join(ROOT, "src/styles/site-brand.css");
const SITE_PRIMITIVES = path.join(ROOT, "src/styles/site-primitives.css");
const BRAND_SCOPE =
  'body:is([data-template-family="site"], [data-template-family="landing"])[data-site-visual="brand"]';

const requiredPrimitives = [
  "page", "display", "page-title", "section-title", "subtitle", "body",
  "supporting", "eyebrow", "ui", "technical", "section",
  "section--entry", "reading", "actions", "surface--light",
  "surface--soft", "surface--muted", "surface--dark", "datum-top",
  "datum-bottom", "action", "action--primary", "action--secondary",
  "action--tertiary",
];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(entryPath));
    else if (/\.(astro|css|[cm]?[jt]sx?)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitTopLevelSelectorList(selectorList) {
  const branches = [];
  let branchStart = 0;
  let parenthesisDepth = 0;

  for (let index = 0; index < selectorList.length; index += 1) {
    const character = selectorList[index];
    if (character === "(") parenthesisDepth += 1;
    else if (character === ")") parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    else if (character === "," && parenthesisDepth === 0) {
      branches.push(selectorList.slice(branchStart, index).trim());
      branchStart = index + 1;
    }
  }

  branches.push(selectorList.slice(branchStart).trim());
  return branches.filter(Boolean);
}

test("selector lists split only on top-level commas", () => {
  assert.deepEqual(splitTopLevelSelectorList(BRAND_SCOPE), [BRAND_SCOPE]);
  assert.deepEqual(splitTopLevelSelectorList(`${BRAND_SCOPE} .safe, .unsafe`), [
    `${BRAND_SCOPE} .safe`,
    ".unsafe",
  ]);
});

test("SiteLayout owns the shared Site style entrypoint", async () => {
  const source = await readFile(SITE_LAYOUT, "utf8");
  assert.match(source, /import\s+["']\.\.\/styles\/site-system\.css["'];/);
  for (const direct of ["site-brand", "brand-foundation", "site-primitives"]) {
    assert.doesNotMatch(source, new RegExp(`import\\s+["']\\.\\.\\/styles\\/${direct}\\.css["']`));
  }
});

test("site-system is an import-only entrypoint with exact order", async () => {
  const css = withoutComments(await readFile(SITE_SYSTEM, "utf8"));
  const imports = [...css.matchAll(/@import\s+["']([^"']+)["']\s*;/g)].map((match) => match[1]);
  assert.deepEqual(imports, [
    "./brand-foundation.css", "./site-brand.css", "./site-primitives.css",
  ]);
  assert.equal(css.replace(/@import\s+["'][^"']+["']\s*;/g, "").trim(), "");
});

test("site-brand remains a single semantic-token rule, not an entrypoint", async () => {
  const css = withoutComments(await readFile(SITE_BRAND, "utf8"));
  assert.doesNotMatch(css, /@import\b/);
  assert.equal((css.match(/\{/g) ?? []).length, 1);
  assert.match(css, new RegExp(`^\\s*${BRAND_SCOPE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`));
  assert.match(css, /--site-[\w-]+\s*:/);
});

test("shared primitive API is complete, explicitly scoped, and semantic", async () => {
  const css = withoutComments(await readFile(SITE_PRIMITIVES, "utf8"));
  const pageHost = `${BRAND_SCOPE}.site-primitive-page`;
  const obsoletePageHost = `${BRAND_SCOPE} .site-primitive-page`;

  for (const primitive of requiredPrimitives) {
    assert.match(css, new RegExp(`\\.site-primitive-${primitive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`));
  }

  assert.match(
    css,
    new RegExp(`${pageHost.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`),
  );
  assert.doesNotMatch(
    css,
    new RegExp(
      `${obsoletePageHost.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s*(?:[,{*]))`,
    ),
  );
  for (const suffix of [" *", " *::before", " *::after"]) {
    assert.ok(css.includes(`${pageHost}${suffix}`));
  }

  const selectors = [...css.matchAll(/(?:^|\})\s*([^@{}][^{}]*)\{/gm)]
    .map((match) => match[1].trim())
    .filter((selector) => !selector.startsWith("@media"));
  assert.ok(selectors.length > 0);
  for (const selector of selectors.flatMap(splitTopLevelSelectorList)) {
    assert.ok(
      selector.startsWith(`${BRAND_SCOPE} .site-primitive-`) ||
        selector.startsWith(pageHost),
      `unscoped selector: ${selector}`,
    );
  }
  assert.doesNotMatch(css, new RegExp(`${BRAND_SCOPE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`));
  assert.match(css, /var\(\s*--site-/);
});

test("primitive layer respects Brand, legacy, color, and motion boundaries", async () => {
  const css = await readFile(SITE_PRIMITIVES, "utf8");
  const forbidden = [
    "Poppins", "--color-marca", "--color-marca-suave", "--color-piscina",
    "--color-ouro", "--font-sans", "system-ui", "Canvas", "CanvasText",
    "--brand-color-", "--brand-font-", "gradient", "transition", "animation",
  ];
  for (const value of forbidden) assert.ok(!css.includes(value), `must not contain ${value}`);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(css, /(^|[;{])\s*transform\s*:/m);
});

test("primitive consumers remain limited to explicitly authorized production consumers", async () => {
  const roots = ["src/pages", "src/layouts", "src/components"];
  const files = (await Promise.all(roots.map((root) => sourceFiles(path.join(ROOT, root))))).flat();
  const brandConsumers = [];
  const primitiveConsumers = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(ROOT, file);
    if (/visualMode\s*=\s*["']brand["']/.test(source)) brandConsumers.push(relative);
    if (source.includes("site-primitive-")) primitiveConsumers.push(relative);
  }
  const authorizedBrandConsumers = [
    "src/pages/index.astro",
    "src/pages/lp/fibra.astro",
    "src/pages/lp/reforma.astro",
    "src/pages/lp/vazamento.astro",
    "src/pages/inicie-seu-projeto.astro",
    "src/pages/metodo-royal.astro",
    "src/pages/projetos.astro",
    "src/pages/projetos/[slug].astro",
    "src/pages/sobre.astro",
    "src/components/site/SegmentContextPage.astro",
  ];
  const authorizedPrimitiveConsumers = [
    ...authorizedBrandConsumers,
    "src/components/site/RoyalCaseDetail.astro",
    "src/components/site/SegmentRouter.astro",
    "src/components/site/StructuredIntake.astro",
  ];
  assert.deepEqual(brandConsumers.sort(), authorizedBrandConsumers.sort());
  assert.deepEqual(primitiveConsumers.sort(), authorizedPrimitiveConsumers.sort());
  for (const component of ["Button", "Card", "Section", "Surface", "Typography"]) {
    assert.ok(!files.some((file) => file.endsWith(`/${component}.astro`)), `${component}.astro must not exist`);
  }
});

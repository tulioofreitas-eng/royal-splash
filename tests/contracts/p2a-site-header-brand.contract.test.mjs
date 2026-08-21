import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SITE_HEADER = path.join(ROOT, "src/components/site/SiteHeader.astro");
const SITE_LAYOUT = path.join(ROOT, "src/layouts/SiteLayout.astro");
const CONSUMER_ROOTS = ["src/pages", "src/layouts", "src/components"];

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

test("SiteHeader exposes an explicit functional-default visual contract", async () => {
  const source = await readFile(SITE_HEADER, "utf8");

  assert.match(
    source,
    /type\s+SiteHeaderVisualMode\s*=\s*["']functional["']\s*\|\s*["']brand["']/,
  );
  assert.match(source, /visualMode\?\s*:\s*SiteHeaderVisualMode/);
  assert.match(source, /visualMode\s*=\s*["']functional["']/);
  assert.match(source, /data-site-header-visual=\{visualMode\}/);
  assert.match(source, /data-site-header(?:\s|>)/);
});

test("Brand identity uses only the canonical H1 Gold signature", async () => {
  const source = await readFile(SITE_HEADER, "utf8");

  assert.match(
    source,
    /src=["']\/brand\/identity\/signatures\/royal-splash-signature-h1-gold\.svg["']/,
  );
  assert.doesNotMatch(source, /royal-splash-signature-p2/i);
  assert.doesNotMatch(source, /crown-only/i);
  assert.doesNotMatch(source, /royal-splash-signature-h1-white/i);
  assert.match(source, /["']Royal Splash["']/);
  assert.match(source, /aria-label=["']Royal Splash — Início["']/);
  assert.match(source, /alt=["']["']/);
  assert.match(source, /height:\s*auto/);
});

test("approved navigation, CTA, analytics, and mobile semantics remain present", async () => {
  const source = await readFile(SITE_HEADER, "utf8");
  const labels = [
    "Projetos",
    "Residencial",
    "Corporativo / Institucional",
    "Método Royal",
    "A Royal",
    "Inicie seu projeto",
    "Contato",
  ];

  for (const label of labels) {
    assert.ok(source.includes(label), `missing navigation label: ${label}`);
  }

  assert.match(source, /href=["']\/inicie-seu-projeto["']/);
  assert.match(source, /data-analytics-cta/);
  assert.match(source, /data-analytics-component=["']site_header["']/);
  assert.match(source, /data-analytics-subject=["']project_start["']/);
  assert.match(source, /data-analytics-channel=["']site_form["']/);
  assert.match(source, /aria-label=["']Navegação principal["']/);
  assert.match(source, /aria-expanded=["']false["']/);
  assert.match(source, /aria-controls=["']site-mobile-navigation["']/);
  assert.match(source, /id=["']site-mobile-navigation["']/);
  assert.match(source, /event\.key\s*===\s*["']Escape["']/);
  assert.match(source, /trigger\.focus\(\)/);
  assert.match(source, /firstLink\.focus\(\)/);
  assert.match(source, /setOpen\(false,\s*true\)/);
  assert.match(source, /Abrir navegação/);
  assert.match(source, /Fechar navegação/);
});

test("Brand rules are scoped and consume only Site semantic tokens", async () => {
  const source = await readFile(SITE_HEADER, "utf8");
  const brandRules = source
    .split('.site-header[data-site-header-visual="brand"]')
    .slice(1)
    .join("");

  assert.ok(brandRules.length > 0);
  assert.match(brandRules, /var\(--site-color-surface-dark\)/);
  assert.match(brandRules, /var\(--site-color-text-on-dark\)/);
  assert.match(brandRules, /var\(--site-font-ui\)/);
  assert.match(brandRules, /var\(--site-color-accent-on-dark\)/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);

  for (const forbidden of [
    "Poppins",
    "--color-marca",
    "--color-marca-suave",
    "--color-piscina",
    "--color-ouro",
    "--font-sans",
    "--brand-color-royal-gold",
  ]) {
    assert.ok(!source.includes(forbidden), `must not reference ${forbidden}`);
  }
});

test("only the approved About page activates Brand mode", async () => {
  const excluded = new Set([SITE_HEADER, SITE_LAYOUT]);
  const files = (
    await Promise.all(
      CONSUMER_ROOTS.map((directory) => sourceFiles(path.join(ROOT, directory))),
    )
  ).flat().filter((file) => !excluded.has(file));
  const optIns = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");

    if (/visualMode\s*=\s*["']brand["']/.test(source)) {
      optIns.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(optIns, ["src/pages/sobre.astro"]);
});

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const ABOUT_PAGE = path.join(ROOT, "src/pages/sobre.astro");

async function astroPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await astroPages(entryPath));
    } else if (entry.name.endsWith(".astro")) {
      files.push(entryPath);
    }
  }

  return files;
}

test("About explicitly activates Brand at layout and header boundaries", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");

  assert.match(source, /import\s+["']\.\.\/styles\/brand-foundation\.css["'];/);
  assert.match(source, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(source, /<SiteHeader[\s\S]*?visualMode=["']brand["']/);
  assert.match(source, /<h1[^>]*>[\s\S]*?A Royal[\s\S]*?<\/h1>/);
});

test("About preserves approved destinations and qualified-action analytics", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");

  for (const href of [
    "/projetos",
    "/metodo-royal",
    "/inicie-seu-projeto",
    "/contato",
  ]) {
    assert.match(source, new RegExp(`href=["']${href}["']`));
  }

  assert.match(source, /data-analytics-cta/);
  assert.match(source, /data-analytics-component=["']royal_trust["']/);
  assert.match(source, /data-analytics-subject=["']project_start["']/);
  assert.match(source, /data-analytics-channel=["']site_form["']/);
});

test("About remains inside controlled institutional content boundaries", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");
  const contentSource = source.replace(/<style\b[\s\S]*?<\/style>/g, "");

  for (const unsupportedClaim of [
    "20+",
    "500+",
    "100%",
    "Rio de Janeiro",
    "Santa Catarina",
    "equipe própria",
  ]) {
    assert.ok(
      !contentSource.includes(unsupportedClaim),
      `unsupported claim found: ${unsupportedClaim}`,
    );
  }
});

test("About consumes Site semantics without legacy or Brand primitive dependencies", async () => {
  const source = await readFile(ABOUT_PAGE, "utf8");

  for (const token of [
    "--site-color-page-background",
    "--site-color-text-primary",
    "--site-font-text",
    "--site-font-display",
    "--site-type-display-xl",
    "--site-layout-content-max",
    "--site-layout-reading-max",
  ]) {
    assert.ok(source.includes(token), `missing Site semantic token: ${token}`);
  }

  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(source, /--brand-(?:color|font)-/);

  for (const forbidden of [
    "Poppins",
    "--color-marca",
    "--color-marca-suave",
    "--color-piscina",
    "--color-ouro",
    "--font-sans",
    "system-ui",
    "Canvas",
    "CanvasText",
  ]) {
    assert.ok(!source.includes(forbidden), `must not reference ${forbidden}`);
  }
});

test("About is the only Site page activating Brand", async () => {
  const pages = await astroPages(path.join(ROOT, "src/pages"));
  const optIns = [];

  for (const file of pages) {
    const source = await readFile(file, "utf8");

    if (/visualMode\s*=\s*["']brand["']/.test(source)) {
      optIns.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(optIns, ["src/pages/sobre.astro"]);
});

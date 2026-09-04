import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footer = await readFile(
  new URL("../../src/components/site/SiteFooter.astro", import.meta.url),
  "utf8",
);

const layout = await readFile(
  new URL("../../src/layouts/SiteLayout.astro", import.meta.url),
  "utf8",
);

const caseDetailPage = await readFile(
  new URL("../../src/pages/projetos/[slug].astro", import.meta.url),
  "utf8",
);

test("SiteLayout owns one canonical SiteFooter instance", () => {
  assert.match(layout, /import SiteFooter from ["']\.\.\/components\/site\/SiteFooter\.astro["']/);
  assert.equal(layout.match(/<SiteFooter\s*\/>/g)?.length, 1);
  assert.match(
    layout,
    /<slot name=["']footer["']>\s*<SiteFooter\s*\/>\s*<\/slot>/,
  );
  assert.match(caseDetailPage, /import SiteLayout from/);
  assert.match(caseDetailPage, /<SiteLayout\b/);
});

test("SiteFooter exposes the accepted identity and canonical destinations", () => {
  assert.match(
    footer,
    /\/brand\/identity\/signatures\/royal-splash-signature-h1-gold\.svg/,
  );
  assert.match(footer, /<footer\b/);
  assert.match(footer, /aria-label=["']Navegação do rodapé["']/);

  for (const href of [
    "/",
    "/projetos",
    "/servicos",
    "/corporativo",
    "/metodo-royal",
    "/sobre",
    "/inicie-seu-projeto",
    "/contato",
    "/politica-de-privacidade",
  ]) {
    assert.match(footer, new RegExp(`href: ["']${href.replaceAll("/", "\\/")}["']`));
  }
});

test("SiteFooter remains outside Atlas and provider boundaries", () => {
  assert.doesNotMatch(
    footer,
    /atlas|supabase|ghl|gtm|whatsapp|fetch\s*\(|form\b|api\//i,
  );
});

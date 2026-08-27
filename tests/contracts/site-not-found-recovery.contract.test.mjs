import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(
  new URL("../../src/pages/404.astro", import.meta.url),
  "utf8",
);

test("404 composes the accepted canonical Site shell in Brand mode", () => {
  assert.match(page, /import SiteLayout from ["']\.\.\/layouts\/SiteLayout\.astro["']/);
  assert.match(page, /import SiteHeader from ["']\.\.\/components\/site\/SiteHeader\.astro["']/);
  assert.match(page, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(page, /<SiteHeader slot=["']header["'] visualMode=["']brand["']\s*\/>/);
  assert.doesNotMatch(page, /<SiteFooter\b|<footer\b|<main\b/);
});

test("404 exposes a bounded recovery state and canonical routes", () => {
  assert.match(page, /Página não encontrada/);
  assert.match(page, /href=["']\/["']/);
  assert.match(page, /href=["']\/projetos["']/);
  assert.equal(page.match(/<h1\b/g)?.length, 1);
  assert.match(page, /robots=["']noindex, nofollow["']/);
});

test("404 remains outside Atlas and provider boundaries", () => {
  assert.doesNotMatch(
    page,
    /atlas|supabase|ghl|gtm|formspree|whatsapp|fetch\s*\(|<form\b|api\//i,
  );
});

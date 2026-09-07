import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { ROYAL_ROUTE_ROBOTS, getRoyalCanonicalUrl, getRoyalRouteRobots,
  royalRobotsTxt, royalSitemapXml } from "../../src/seo/royal-policy.ts";
import { resolveSeoRobots } from "../../src/seo/runtime.ts";

const indexable = ["/", "/sobre", "/metodo-royal", "/servicos", "/corporativo", "/projetos"];
const lps = ["corporativo", "fibra", "lazer", "piscinas", "reforma", "reparo-subaquatico", "sauna", "vazamento"];

test("only the six reviewed institutional surfaces are indexable", () => {
  assert.deepEqual(Object.keys(ROYAL_ROUTE_ROBOTS).filter(path => getRoyalRouteRobots(path) === "index, follow"), indexable);
  for (const path of indexable) {
    assert.equal(resolveSeoRobots({ isProduction: true }, getRoyalRouteRobots(path)), "index, follow");
  }
});

test("every current public page and LP has an explicit review; unknown pages fail closed", async () => {
  for (const file of await readdir(new URL("../../src/pages", import.meta.url))) {
    if (!file.endsWith(".astro") || file === "404.astro") continue;
    const route = file === "index.astro" ? "/" : `/${file.replace(/\.astro$/, "")}`;
    assert.ok(Object.hasOwn(ROYAL_ROUTE_ROBOTS, route), `${route} needs individual review`);
  }
  assert.deepEqual((await readdir(new URL("../../src/pages/lp", import.meta.url))).filter(f => f.endsWith(".astro")).sort(), lps.map(x => `${x}.astro`).sort());
  for (const path of ["/404", "/new-page", "/projetos/unreviewed"]) {
    assert.equal(getRoyalRouteRobots(path), "noindex, nofollow");
    assert.equal(getRoyalCanonicalUrl(path), undefined);
  }
});

test("campaign LPs remain noindex and permit following; utility and unresolved copy stay noindex", () => {
  for (const lp of lps) assert.equal(getRoyalRouteRobots(`/lp/${lp}`), "noindex, follow");
  assert.equal(getRoyalRouteRobots("/obrigado"), "noindex");
  for (const route of ["/inicie-seu-projeto", "/contato", "/politica-de-privacidade"]) {
    assert.equal(getRoyalRouteRobots(route), "noindex, nofollow");
  }
});

test("sitemap contains exactly the indexable canonical URLs, with no campaign or technical surfaces", () => {
  const xml = royalSitemapXml(true);
  assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), indexable.map(getRoyalCanonicalUrl));
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  assert.doesNotMatch(xml, /lp\/|obrigado|inicie-seu-projeto|contato|politica-de-privacidade|404/);
});

test("canonical identity uses verified www HTTPS origin, normalizes trailing slash and rejects arbitrary input", () => {
  assert.equal(getRoyalCanonicalUrl("/"), "https://www.royalsplash.com.br/");
  assert.equal(getRoyalCanonicalUrl("/sobre/"), "https://www.royalsplash.com.br/sobre");
  for (const path of ["//evil.example", "/sobre?email=a@example.com", "/sobre#private", "https://evil.example/sobre"]) {
    assert.equal(getRoyalCanonicalUrl(path), undefined);
  }
});

test("production robots permits reading LP noindex and references sitemap; all preview surfaces stay closed", () => {
  assert.equal(royalRobotsTxt(true), "User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://www.royalsplash.com.br/sitemap.xml\n");
  assert.equal(royalRobotsTxt(false), "User-agent: *\nDisallow: /\n");
  assert.doesNotMatch(royalSitemapXml(false), /<url>/);
  for (const path of Object.keys(ROYAL_ROUTE_ROBOTS)) {
    assert.equal(resolveSeoRobots({ isProduction: false }, getRoyalRouteRobots(path)), "noindex, nofollow");
  }
});

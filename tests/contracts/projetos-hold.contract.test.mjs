import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

test("/projetos remains fully held: no routes and no primary site links", () => {
  assert.equal(existsSync("src/pages/projetos.astro"), false);
  assert.equal(existsSync("src/pages/projetos/[slug].astro"), false);

  for (const path of [
    "src/components/site/SiteHeader.astro",
    "src/components/site/SiteFooter.astro",
    "src/pages/index.astro",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /href=["']\/projetos(?:\/|["'])/);
  }
});

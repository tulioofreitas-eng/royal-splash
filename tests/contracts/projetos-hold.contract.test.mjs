import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function astroFiles(root) {
  const out = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...astroFiles(path));
    else if (path.endsWith(".astro")) out.push(path);
  }
  return out;
}

test("/projetos remains fully held: no routes and no links anywhere in Astro UI", () => {
  assert.equal(existsSync("src/pages/projetos.astro"), false);
  assert.equal(existsSync("src/pages/projetos/[slug].astro"), false);

  const offenders = [];
  for (const path of astroFiles("src")) {
    const source = readFileSync(path, "utf8");
    if (/href=["']\/projetos(?:\/|["'])/.test(source)) offenders.push(path);
  }

  assert.deepEqual(offenders, []);
});

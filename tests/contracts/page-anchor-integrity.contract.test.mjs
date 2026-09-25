import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

test("same-page hash links point to an id present in the same Astro page", () => {
  const failures = [];

  for (const path of astroFiles("src/pages")) {
    const source = readFileSync(path, "utf8");
    const ids = new Set(
      [...source.matchAll(/\\bid=["']([^"']+)["']/g)].map((match) => match[1]),
    );
    const anchors = [
      ...source.matchAll(/\\bhref=["']#([^"']+)["']/g),
    ].map((match) => match[1]);

    for (const anchor of anchors) {
      if (!ids.has(anchor)) failures.push(`${path}: #${anchor}`);
    }
  }

  assert.deepEqual(failures, []);
});

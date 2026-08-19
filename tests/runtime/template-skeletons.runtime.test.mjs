import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repoUrl = new URL("../../", import.meta.url);

const readRepoFile = async (path) =>
  readFile(new URL(path, repoUrl), "utf8");

test("site runtime skeleton exists and composes core semantic primitives", async () => {
  const source = await readRepoFile("src/layouts/SiteLayout.astro");

  assert.match(source, /SkipLink/);
  assert.match(source, /MainContent/);
  assert.match(source, /bodyClass/);
  assert.match(source, /slot name="head"/);
  assert.match(source, /slot name="body-start"/);
  assert.match(source, /slot name="header"/);
  assert.match(source, /<slot\s*\/>/);
  assert.match(source, /slot name="footer"/);
  assert.match(source, /slot name="body-end"/);
});

test("landing runtime skeleton exists and composes core semantic primitives", async () => {
  const source = await readRepoFile("src/layouts/LandingLayout.astro");

  assert.match(source, /SkipLink/);
  assert.match(source, /MainContent/);
  assert.match(source, /bodyClass/);
  assert.match(source, /slot name="head"/);
  assert.match(source, /slot name="body-start"/);
  assert.match(source, /slot name="header"/);
  assert.match(source, /<slot\s*\/>/);
  assert.match(source, /slot name="footer"/);
  assert.match(source, /slot name="body-end"/);
});

test("/sobre is a representative site composition", async () => {
  const source = await readRepoFile("src/pages/sobre.astro");

  assert.match(source, /SiteLayout/);
  assert.doesNotMatch(source, /LandingLayout/);
});

test("/lp/reparo-subaquatico is a representative landing composition", async () => {
  const source = await readRepoFile(
    "src/pages/lp/reparo-subaquatico.astro",
  );

  assert.match(source, /LandingLayout/);
  assert.doesNotMatch(source, /SiteLayout/);
});

test("runtime skeletons remain free of production integration coupling", async () => {
  const paths = [
    "src/layouts/SiteLayout.astro",
    "src/layouts/LandingLayout.astro",
  ];

  const sources = await Promise.all(paths.map(readRepoFile));
  const executableSource = sources.join("\n");

  assert.doesNotMatch(executableSource, /\bSupabase\b/i);
  assert.doesNotMatch(executableSource, /\bAtlas\b/i);
  assert.doesNotMatch(executableSource, /\bGTM\b/i);
  assert.doesNotMatch(executableSource, /\bGA4\b/i);
  assert.doesNotMatch(executableSource, /\bFormspree\b/i);
  assert.doesNotMatch(executableSource, /\bGHL\b/i);
  assert.doesNotMatch(executableSource, /\bfetch\s*\(/i);
  assert.doesNotMatch(executableSource, /process\.env/i);
  assert.doesNotMatch(executableSource, /import\.meta\.env/i);
});

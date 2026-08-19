import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = (name) =>
  new URL(`../../src/components/runtime/${name}.astro`, import.meta.url);

test("skip link targets the stable main-content focus destination", async () => {
  const source = await readFile(componentUrl("SkipLink"), "utf8");

  assert.match(source, /<a\b/);
  assert.match(source, /href=["'{#]*#main-content/);
  assert.match(source, /:focus/);
});

test("main content primitive owns the primary landmark and stable focus target", async () => {
  const source = await readFile(componentUrl("MainContent"), "utf8");

  assert.match(source, /<main\b/);
  assert.match(source, /main-content/);
  assert.match(source, /tabindex=["'{-]*-1/);
  assert.match(source, /<slot\s*\/>/);
});

test("semantic section supports explicit accessible naming", async () => {
  const source = await readFile(componentUrl("SemanticSection"), "utf8");

  assert.match(source, /<section\b/);
  assert.match(source, /labelledBy/);
  assert.match(source, /aria-labelledby/);
  assert.match(source, /<slot\s*\/>/);
});

test("structural state supports loading, empty and error runtime states", async () => {
  const source = await readFile(componentUrl("StructuralState"), "utf8");

  assert.match(source, /["']loading["']/);
  assert.match(source, /["']empty["']/);
  assert.match(source, /["']error["']/);
  assert.match(source, /role=/);
  assert.match(source, /aria-live/);
  assert.match(source, /<slot\s*\/>/);
});

test("runtime primitives remain brand, provider and integration independent", async () => {
  const names = [
    "SkipLink",
    "MainContent",
    "SemanticSection",
    "StructuralState",
  ];

  const sources = await Promise.all(
    names.map((name) => readFile(componentUrl(name), "utf8")),
  );

  const executableSource = sources
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(executableSource, /\bRoyal\b/i);
  assert.doesNotMatch(executableSource, /royalsplash/i);
  assert.doesNotMatch(executableSource, /\bSupabase\b/i);
  assert.doesNotMatch(executableSource, /\bAtlas\b/i);
  assert.doesNotMatch(executableSource, /\bGTM\b/i);
  assert.doesNotMatch(executableSource, /\bGA4\b/i);
  assert.doesNotMatch(executableSource, /\bGrowth\b/i);
  assert.doesNotMatch(executableSource, /\bbg-marca\b/i);
  assert.doesNotMatch(executableSource, /\btext-piscina\b/i);
  assert.doesNotMatch(executableSource, /\bborder-ouro\b/i);
  assert.doesNotMatch(executableSource, /\bfetch\s*\(/i);
  assert.doesNotMatch(executableSource, /process\.env/i);
  assert.doesNotMatch(executableSource, /import\.meta\.env/i);
});

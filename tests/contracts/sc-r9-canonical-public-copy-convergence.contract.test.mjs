import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "src/pages/index.astro",
  "src/pages/servicos.astro",
  "src/pages/corporativo.astro",
  "src/pages/projetos.astro",
  "src/pages/metodo-royal.astro",
  "src/pages/sobre.astro",
  "src/components/site/SegmentContextPage.astro",
];

const sources = Object.fromEntries(
  await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")])),
);

const visibleTemplateText = (source) => source
  .replace(/^---[\s\S]*?---\s*/, "")
  .replace(/<style\b[\s\S]*?<\/style>/g, "")
  .replace(/<script\b[\s\S]*?<\/script>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/\{[^}]+\}/g, " ")
  .replace(/\s+/g, " ")
  .trim();

test("canonical launch copy excludes visitor-visible implementation and governance terminology", () => {
  const prohibited = /\b(?:implementa(?:ção|do|da)|funcional|governan(?:ça|do|da)|controlad[oa]|superfície institucional|fluxo estruturado|verifica(?:ção|do|da)|publica(?:ção|do|da|vel)|disponível para publicação|catálogo controlado|registro controlado|intake)\b/i;

  for (const [file, source] of Object.entries(sources)) {
    assert.doesNotMatch(visibleTemplateText(source), prohibited, `${file} exposes internal terminology`);
  }
});

test("canonical routes and qualified-action destinations remain intact", () => {
  assert.match(sources["src/pages/index.astro"], /href="\/inicie-seu-projeto"/);
  assert.match(sources["src/pages/projetos.astro"], /href="\/inicie-seu-projeto"/);
  assert.match(sources["src/pages/metodo-royal.astro"], /href="\/inicie-seu-projeto"/);
  assert.match(sources["src/pages/sobre.astro"], /href="\/inicie-seu-projeto"/);
  assert.match(sources["src/components/site/SegmentContextPage.astro"], /`\/inicie-seu-projeto\?context=\$\{encodeURIComponent\(context\)\}`/);
});

test("Projects keeps controlled publication selection and a truthful empty state", () => {
  const projects = sources["src/pages/projetos.astro"];
  assert.match(projects, /selectRoyalPublicCaseDetails\s*\(/);
  assert.match(projects, /publicCases\.length === 0/);
  assert.match(projects, /Nenhum projeto disponível no momento/);
  assert.match(projects, /data-projects-state="empty"/);
});

test("segment routes retain their canonical context values", () => {
  assert.match(sources["src/pages/servicos.astro"], /context="residencial"/);
  assert.match(sources["src/pages/corporativo.astro"], /context="corporativo_institucional"/);
});

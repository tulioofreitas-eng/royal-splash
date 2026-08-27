import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const PAGE = path.join(ROOT, "src/pages/inicie-seu-projeto.astro");
const INTAKE = path.join(ROOT, "src/components/site/StructuredIntake.astro");
const compact = (value) => value.replace(/\s+/g, " ");

const readSources = async () => Promise.all([
  readFile(PAGE, "utf8"),
  readFile(INTAKE, "utf8"),
]);

test("intake route explicitly activates Brand and approved P2B primitives", async () => {
  const [page, intake] = await readSources();

  assert.match(page, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(page, /<SiteHeader[\s\S]*?visualMode=["']brand["']/);
  assert.match(page, /bodyClass=["'][^"']*site-brand-intake[^"']*site-primitive-page[^"']*["']/);

  for (const primitive of [
    "site-primitive-section", "site-primitive-section--entry",
    "site-primitive-page-title", "site-primitive-section-title",
    "site-primitive-body", "site-primitive-supporting",
    "site-primitive-reading", "site-primitive-datum-top",
    "site-primitive-action", "site-primitive-action--tertiary",
  ]) {
    assert.ok(`${page}\n${intake}`.includes(primitive), `missing primitive: ${primitive}`);
  }
});

test("controlled route copy and auxiliary contact destination remain exact", async () => {
  const [page] = await readSources();
  const source = compact(page);

  for (const copy of [
    "Inicie seu projeto",
    "Compartilhe informações sobre o projeto e seus dados de contato para iniciar o preenchimento.",
    "Precisa de outro canal?",
    "Contato direto permanece disponível como caminho auxiliar.",
    "Ver canais de contato",
  ]) assert.ok(source.includes(copy), `controlled copy changed: ${copy}`);

  assert.match(page, /href=["']\/contato["']/);
});

test("public intake copy is task-oriented and excludes implementation terminology", async () => {
  const [page, intake] = await readSources();
  const publicCopy = compact(`${page}\n${intake}`);

  for (const copy of [
    "Preencha as etapas abaixo com o contexto do projeto e seus dados de contato.",
    "Informações recebidas",
    "Recebemos as informações enviadas pelo formulário.",
  ]) assert.ok(publicCopy.includes(copy), `missing public intake copy: ${copy}`);

  assert.doesNotMatch(
    publicCopy,
    /Tranche|fluxo funcional|ambiente de verificação|experiência do Site|verificar a estrutura de envio|envio estruturado pelo Site/i,
  );
});

test("StructuredIntake preserves approved three-stage fields, endpoint, hooks, and success contract", async () => {
  const [, intake] = await readSources();

  assert.equal((intake.match(/data-intake-step=["'][1-3]["']/g) ?? []).length, 3);
  assert.equal((intake.match(/data-progress-step=["'][1-3]["']/g) ?? []).length, 3);
  for (const step of ["SOBRE O PROJETO", "O QUE VOCÊ PRECISA", "SEUS DADOS"]) {
    assert.match(intake, new RegExp(`data-progress-step=["'][1-3]["']>[\\s\\S]*?${step}`));
  }
  for (const name of [
    "projectContext", "projectNeed", "city", "name", "email", "phone", "consent",
  ]) assert.match(intake, new RegExp(`name=["']${name}["']`));
  assert.match(intake, /<input(?=[^>]*name=["']city["'])(?=[^>]*\brequired\b)[^>]*>/);

  assert.match(intake, /action=["']\/api\/site-lead-preview["']/);
  assert.match(intake, /fetch\(\s*["']\/api\/site-lead-preview["']/);
  assert.match(intake, /method=["']post["']/);
  assert.match(intake, /\bnovalidate\b/);

  for (const hook of [
    "data-structured-intake", "data-intake-form", "data-progress-step",
    "data-intake-step", "data-next-step", "data-previous-step",
    "data-error-for", "data-contact-channel-error", "data-submission-error",
    "data-intake-success",
  ]) assert.ok(intake.includes(hook), `missing runtime hook: ${hook}`);

  assert.match(intake, /site:lead-submitted/);
  assert.match(intake, /componentRef:\s*["']structured_intake["']/);
  assert.match(intake, /subjectRef:\s*payload\.projectContext/);
  assert.match(intake, /channelRef:\s*["']site_form["']/);
});

test("P2E production delta stays within Brand, provider, and motion boundaries", async () => {
  const sources = (await readSources()).join("\n");

  assert.doesNotMatch(sources, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(sources, /--brand-(?:color|font)-/);
  assert.doesNotMatch(sources, /--color-[\w-]+/);

  for (const forbidden of [
    "Poppins", "system-ui", "Canvas", "CanvasText", "gradient",
    "box-shadow", "transition", "animation", "Supabase", "Atlas",
    "Formspree", "GHL",
  ]) assert.ok(!sources.includes(forbidden), `forbidden intake dependency: ${forbidden}`);
});

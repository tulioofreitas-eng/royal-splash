import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const PROJECTS = path.join(ROOT, "src/pages/projetos.astro");
const CASES = path.join(ROOT, "src/content/royal/cases.ts");
const DETAILS = path.join(ROOT, "src/content/royal/case-details.ts");

const compact = (value) => value.replace(/\s+/g, " ");

test("Projects explicitly activates Brand and adopts only approved P2B primitives", async () => {
  const projects = await readFile(PROJECTS, "utf8");

  assert.match(projects, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(projects, /<SiteHeader[\s\S]*?visualMode=["']brand["']/);
  assert.match(projects, /bodyClass=["'][^"']*site-primitive-page[^"']*["']/);

  for (const primitive of [
    "site-primitive-section",
    "site-primitive-section--entry",
    "site-primitive-eyebrow",
    "site-primitive-page-title",
    "site-primitive-section-title",
    "site-primitive-subtitle",
    "site-primitive-body",
    "site-primitive-supporting",
    "site-primitive-reading",
    "site-primitive-actions",
    "site-primitive-datum-top",
    "site-primitive-surface--muted",
    "site-primitive-surface--dark",
    "site-primitive-action--primary",
    "site-primitive-action--tertiary",
  ]) {
    assert.ok(projects.includes(primitive), `Projects missing primitive: ${primitive}`);
  }
});

test("Projects preserves controlled selector architecture, copy, routes, states, count, and analytics", async () => {
  const projects = await readFile(PROJECTS, "utf8");
  const source = compact(projects);

  assert.match(projects, /selectRoyalPublicCaseDetails/);
  assert.match(projects, /cases:\s*royalCases/);
  assert.match(projects, /evidence:\s*royalEvidence/);
  assert.match(projects, /details:\s*royalCaseDetails/);
  assert.match(projects, /data-projects-count=\{publicCases\.length\}/);
  assert.match(projects, /publicCases\.length === 0/);
  assert.match(projects, /data-projects-state=["']empty["']/);
  assert.match(projects, /data-projects-state=["']available["']/);
  assert.match(projects, /href=\{`\/projetos\/\$\{siteCase\.slug\}`\}/);

  for (const copy of [
    "Consulte os projetos atualmente disponíveis e escolha o próximo passo para seu projeto.",
    "Projetos disponíveis",
    "Nenhum projeto disponível no momento",
    "Você ainda pode conhecer o Método Royal ou iniciar seu projeto.",
    "Avance com o contexto do seu projeto",
    "Compartilhe informações sobre seu projeto quando estiver pronto para iniciar o preenchimento.",
  ]) {
    assert.ok(source.includes(copy), `Projects controlled copy changed: ${copy}`);
  }

  for (const href of [
    "/metodo-royal",
    "/sobre",
    "/inicie-seu-projeto",
    "/contato",
  ]) {
    assert.match(projects, new RegExp(`href=["']${href}["']`));
  }

  for (const stage of ["entry", "library", "qualified-action"]) {
    assert.match(projects, new RegExp(`data-projects-stage=["']${stage}["']`));
  }

  assert.equal(
    (projects.match(/data-analytics-component=["']royal_projects["']/g) ?? []).length,
    1,
  );
  assert.equal(
    (projects.match(/data-analytics-subject=["']project_start["']/g) ?? []).length,
    1,
  );
  assert.equal(
    (projects.match(/data-analytics-channel=["']site_form["']/g) ?? []).length,
    1,
  );
});

test("Royal production Case, Evidence, and Detail catalogs remain intentionally empty", async () => {
  const [cases, details] = await Promise.all([
    readFile(CASES, "utf8"),
    readFile(DETAILS, "utf8"),
  ]);

  assert.match(
    cases,
    /export const royalCases:\s*readonly SiteCase\[\]\s*=\s*\[\];/,
  );
  assert.match(
    cases,
    /export const royalEvidence:\s*readonly Evidence\[\]\s*=\s*\[\];/,
  );
  assert.match(
    details,
    /export const royalCaseDetails:\s*readonly RoyalCaseDetailRecord\[\]\s*=\s*\[\];/,
  );
});

test("WP1 remains inside Brand, dependency, motion, content, and abstraction boundaries", async () => {
  const projects = await readFile(PROJECTS, "utf8");

  assert.doesNotMatch(
    projects,
    /import\s+["'][^"']*\/(?:brand-foundation|site-brand|site-primitives|site-system)\.css["']/,
  );
  assert.doesNotMatch(projects, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(projects, /--brand-(?:color|font)-/);
  assert.doesNotMatch(
    projects,
    /global\.css|BotaoWhatsapp|GoogleReviews|wa\.me|astro:assets|bg-marca|text-piscina|obra-[0-9]|components\/site\/RoyalCaseDetail\.astro/i,
  );

  for (const forbidden of [
    "Poppins",
    "--color-marca",
    "--color-marca-suave",
    "--color-piscina",
    "--color-ouro",
    "--font-sans",
    "system-ui",
    "Canvas",
    "CanvasText",
    "gradient",
    "box-shadow",
    "transition",
    "animation",
  ]) {
    assert.ok(!projects.includes(forbidden), `forbidden WP1 dependency: ${forbidden}`);
  }
});

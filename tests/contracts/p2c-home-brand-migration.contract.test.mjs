import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const HOME = path.join(ROOT, "src/pages/index.astro");
const ROUTER = path.join(ROOT, "src/components/site/SegmentRouter.astro");

const readSources = async () => Promise.all([
  readFile(HOME, "utf8"),
  readFile(ROUTER, "utf8"),
]);

test("Home explicitly activates Brand and adopts the approved P2B primitives", async () => {
  const [home] = await readSources();

  assert.match(home, /<SiteLayout[\s\S]*?visualMode=["']brand["']/);
  assert.match(home, /<SiteHeader[\s\S]*?visualMode=["']brand["']/);
  assert.match(home, /bodyClass=["'][^"']*site-primitive-page[^"']*["']/);

  for (const primitive of [
    "site-primitive-section", "site-primitive-section--entry",
    "site-primitive-eyebrow", "site-primitive-page-title",
    "site-primitive-section-title", "site-primitive-subtitle",
    "site-primitive-body", "site-primitive-supporting",
    "site-primitive-reading", "site-primitive-actions",
    "site-primitive-datum-top", "site-primitive-surface--dark",
    "site-primitive-action--primary", "site-primitive-action--tertiary",
  ]) assert.ok(home.includes(primitive), `Home missing primitive: ${primitive}`);
});

test("SegmentRouter inherits Brand mode while retaining its specific semantic contract", async () => {
  const [, router] = await readSources();

  assert.doesNotMatch(router, /visualMode/);
  assert.match(router, /data-segment-router/);
  assert.match(router, /aria-labelledby=["']segment-router-heading["']/);
  assert.equal((router.match(/<article\b/g) ?? []).length, 2);

  for (const primitive of [
    "site-primitive-section", "site-primitive-datum-top",
    "site-primitive-section-title", "site-primitive-subtitle",
    "site-primitive-body", "site-primitive-supporting",
    "site-primitive-reading", "site-primitive-action--tertiary",
  ]) assert.ok(router.includes(primitive), `SegmentRouter missing primitive: ${primitive}`);

  for (const href of ["/servicos", "/corporativo"]) {
    assert.match(router, new RegExp(`href=["']${href}["']`));
  }
});

test("Home and SegmentRouter preserve exact controlled copy, routes, stages, and analytics", async () => {
  const [home, router] = await readSources();
  const compact = (value) => value.replace(/\s+/g, " ");
  const homeCopy = compact(home);
  const routerCopy = compact(router);

  for (const copy of [
    "Royal Splash",
    "Encontre o contexto certo para avançar.",
    "Explore o contexto relevante, consulte projetos e evidências disponíveis e avance quando estiver pronto para iniciar seu projeto.",
    "Projetos e evidências",
    "Consulte a área de Projetos para acessar conteúdo de prova estruturado conforme evidências verificadas estiverem disponíveis.",
    "Método e confiança", "Método Royal",
    "Entenda a estrutura de método e processo sustentada pelas evidências disponíveis.",
    "A Royal",
    "Acesse a superfície institucional destinada à compreensão e confiança sobre a Royal.",
    "Próximo passo",
    "Quando fizer sentido avançar, compartilhe o contexto do seu projeto pelo fluxo estruturado.",
    "Contato e canais auxiliares",
  ]) assert.ok(homeCopy.includes(copy), `Home copy changed: ${copy}`);

  for (const copy of [
    "Escolha seu contexto",
    "Siga pela experiência que corresponde ao contexto do seu projeto.",
    "Residencial",
    "Explore a jornada destinada a necessidades em contexto residencial.",
    "Explorar Residencial",
    "Corporativo / Institucional",
    "Explore a jornada destinada a contextos corporativos ou institucionais.",
    "Explorar Corporativo / Institucional",
  ]) assert.ok(routerCopy.includes(copy), `SegmentRouter copy changed: ${copy}`);

  for (const href of [
    "/inicie-seu-projeto", "/projetos", "/metodo-royal", "/sobre", "/contato",
  ]) assert.match(home, new RegExp(`href=["']${href}["']`));

  for (const stage of ["entry", "proof", "method-trust", "qualified-action"]) {
    assert.match(home, new RegExp(`data-home-stage=["']${stage}["']`));
  }

  for (const component of ["home_entry", "home_qualified_action"]) {
    assert.match(home, new RegExp(`data-analytics-component=["']${component}["']`));
  }
  assert.equal((home.match(/data-analytics-subject=["']project_start["']/g) ?? []).length, 2);
  assert.equal((home.match(/data-analytics-channel=["']site_form["']/g) ?? []).length, 2);
});

test("WP3 remains inside style, dependency, motion, and abstraction boundaries", async () => {
  const [home, router] = await readSources();
  const combined = `${home}\n${router}`;

  assert.doesNotMatch(combined, /import\s+["'][^"']*\/(?:brand-foundation|site-brand|site-primitives|site-system)\.css["']/);
  assert.doesNotMatch(combined, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(combined, /--brand-(?:color|font)-/);

  for (const forbidden of [
    "Poppins", "--color-marca", "--color-marca-suave", "--color-piscina",
    "--color-ouro", "--font-sans", "system-ui", "Canvas", "CanvasText",
    "gradient", "box-shadow", "transition", "animation",
  ]) assert.ok(!combined.includes(forbidden), `forbidden WP3 dependency: ${forbidden}`);

  for (const component of ["Button", "Card", "Section", "Surface", "Typography"]) {
    await assert.rejects(access(path.join(ROOT, `src/components/${component}.astro`)));
    await assert.rejects(access(path.join(ROOT, `src/components/site/${component}.astro`)));
  }
});

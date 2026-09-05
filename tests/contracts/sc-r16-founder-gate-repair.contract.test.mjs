import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(path, "utf8");

test("experience shell preserves vertical document flow while clipping only horizontal overflow", async () => {
  const css = await read("src/styles/complete-experience.css");
  assert.match(css, /\.experience-page\{overflow-x:clip;overflow-y:visible\}/);
  assert.doesNotMatch(css, /\.experience-page\{overflow:hidden\}/);
});

test("new-site privacy route uses the shared Royal shell and minimum local data flow", async () => {
  const privacy = await read("src/pages/politica-de-privacidade.astro");
  assert.match(privacy, /SiteLayout/);
  assert.match(privacy, /SiteHeader/);
  assert.match(privacy, /robots="noindex, nofollow"/);
  assert.match(privacy, /sistemas internos e corporativos da Royal Splash/);
  assert.match(privacy, /Você pode revisar, alterar ou não enviar a mensagem/);
  assert.doesNotMatch(privacy, /components\/(Header|Footer|BotaoWhatsapp|GTM)/);
});

test("mobile navigation exposes an accessible compact icon control", async () => {
  const header = await read("src/components/site/SiteHeader.astro");
  assert.match(header, /aria-label="Abrir navegação"/);
  assert.match(header, /site-header__menu-icon/);
  assert.match(header, /open \? "Fechar navegação" : "Abrir navegação"/);
  assert.doesNotMatch(header, />\s*Abrir navegação\s*<\/button>/);
});

test("Fale com a Royal enters the visible site-owned form", async () => {
  const [home, form] = await Promise.all([
    read("src/pages/index.astro"),
    read("src/components/site/ProjectStartForm.astro"),
  ]);
  assert.match(home, /href="\/inicie-seu-projeto"[^>]*>Fale com a Royal<\/a>/);
  assert.match(form, /<form data-project-start-form novalidate>/);
  assert.match(form, /Abrir WhatsApp com contexto/);
  assert.doesNotMatch(form, /fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});

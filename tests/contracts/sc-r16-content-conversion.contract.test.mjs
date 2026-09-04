import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("SC-R16 public experiences protect substantive semantic structure", async () => {
  const [acervo, segment, method, about, contact] = await Promise.all([
    read("src/pages/projetos.astro"),
    read("src/components/site/SegmentContextPage.astro"),
    read("src/pages/metodo-royal.astro"),
    read("src/pages/sobre.astro"),
    read("src/pages/contato.astro"),
  ]);
  assert.match(acervo, /data-projects-count="14"/);
  assert.match(acervo, /Ambientes concluídos/);
  assert.match(acervo, /fibraDepois/);
  assert.doesNotMatch(acervo, /fibraAntes|fibraAplicacao|fibraDetalhe/);
  assert.match(segment, /Como a água entra no projeto residencial/);
  assert.match(segment, /O que muda em espaços coletivos/);
  assert.match(method, /Entendimento → Escopo → Obra → Entrega/);
  assert.match(method, /<ol class="method-depth">/);
  assert.match(about, /Prática e identidade/);
  assert.match(contact, /Ir para Inicie seu Projeto/);
});

test("SC-R16 structured pre-contact remains client-only and intentional", async () => {
  const [page, form, composer] = await Promise.all([
    read("src/pages/inicie-seu-projeto.astro"),
    read("src/components/site/ProjectStartForm.astro"),
    read("src/utils/whatsapp-composer.ts"),
  ]);
  assert.match(page, /<ProjectStartForm \/>/);
  for (const name of ["nome", "tipo_projeto", "escala", "prazo", "questao", "consentimento"]) assert.match(form, new RegExp(`name="${name}"`));
  assert.match(form, /data-error-summary role="alert"/);
  assert.match(form, /event\.preventDefault\(\)/);
  assert.doesNotMatch(form, /fetch\(|localStorage|sessionStorage|XMLHttpRequest/);
  assert.match(composer, /encodeURIComponent\(composeProjectMessage\(context\)\)/);
  assert.match(composer, /if \(escala\)/);
  assert.match(composer, /if \(questao\)/);
});

test("SC-R16 analytics metadata excludes personal and free-text values", async () => {
  const form = await read("src/components/site/ProjectStartForm.astro");
  const analyticsCalls = [...form.matchAll(/track\(([^;]+)\);/g)].map((match) => match[0]).join("\n");
  assert.doesNotMatch(analyticsCalls, /fields\.nome\.value|fields\.escala\.value|fields\.questao\.value|lastMessage/);
  assert.match(analyticsCalls, /form_validation_error/);
  assert.match(analyticsCalls, /form_whatsapp_continue/);
});

test("SC-R16 page-body copy excludes deprecated claims and governance language", async () => {
  const paths = ["src/pages/index.astro","src/pages/projetos.astro","src/pages/sobre.astro","src/pages/metodo-royal.astro","src/pages/contato.astro","src/pages/inicie-seu-projeto.astro","src/components/site/SegmentContextPage.astro"];
  const source = (await Promise.all(paths.map(read))).join("\n");
  for (const banned of [/20\+ anos/i,/500\+ projetos/i,/RJ.?SC/i,/100% próprios/i,/fotografias verificadas/i,/sem nomes, locais ou escopos inventados/i,/síntese editorial progressiva/i,/sem inventar etapas canônicas/i,/evidence supports/i,/MTM Group/i]) assert.doesNotMatch(source, banned);
  const footer = await read("src/components/site/SiteFooter.astro");
  assert.match(footer, /Royal Splash • parte do MTM Group/);
});

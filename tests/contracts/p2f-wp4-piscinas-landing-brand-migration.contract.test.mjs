import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_FAQ = [
  ["Como funciona o desenvolvimento de um projeto de piscina?", "O projeto parte do espaço, das necessidades de uso e dos recursos desejados, do conceito à planta executiva."],
  ["É possível reformar ou modernizar uma piscina existente?", "Sim. A piscina existente pode ser avaliada para integrar recursos como iluminação, aquecimento, automação e tratamento."],
  ["Quais recursos podem ser integrados ao projeto?", "Borda infinita, prainha, iluminação, aquecimento, automação e tratamento podem compor o projeto conforme o contexto."],
  ["O projeto é desenvolvido de acordo com o espaço disponível?", "Sim. O desenho é desenvolvido sob medida para o terreno, o espaço disponível e a forma de uso desejada."],
  ["Como solicitar uma avaliação e orçamento?", "Preencha o formulário desta página para compartilhar seu contexto e receber o contato da equipe Royal Splash."],
];

function normalizedControlledRouteText(source) {
  let template = source.replace(/^---[\s\S]*?---\s*/, "").replace(/<style\b[\s\S]*?<\/style>/g, "");
  const title = template.match(/<LandingLayout\b[^>]*\btitle="([^"]+)"/)?.[1];
  assert.ok(title, "LandingLayout title must remain extractable");
  const faq = template.match(/\{\[\s*\{ pergunta:([\s\S]*?)\]\.map\(\(item\) => \([\s\S]*?\)\)\}/);
  assert.ok(faq, "Piscinas FAQ must remain a route-local mapped disclosure");
  const pairs = [...faq[0].matchAll(/\{ pergunta: '([^']+)', resposta: '([^']+)' \}/g)];
  assert.equal(pairs.length, 5, "Piscinas must expose exactly five Founder-approved FAQ entries");
  template = template.replace(faq[0], pairs.flatMap((match) => [match[1], match[2]]).join(" "));
  const body = template
    .replace(/<LPFooter\b[^>]*\/>/g, " ")
    .replace(/<BotaoWhatsapp\b[^>]*\/>/g, " ")
    .replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title} ${body}`;
}

const sharedProductionFingerprints = {
  "src/layouts/LandingLayout.astro": "7be577f229ec119b3f7669b2b5a326e7909f95c3769c53187568f9a2ff7fbd7b",
  "src/components/LPHeader.astro": "2c34178a5be4199471d5c8b071ce0368da1d7f075a8abc7a4736ce83cf152171",
  "src/components/LPFooter.astro": "4d67b1db7e6d246e3d031f6086218d971efc03ec90f23d7cf6b1cb3d5d408749",
  "src/components/FormularioGHL.astro": "2fb923c34600558a8d03bad47a446b18ea7b274919630fc1924ef2c116933e17",
  "src/components/BotaoWhatsapp.astro": "4e2b8db201fd41d56f70e9fb187eb27a7e6835949fc66d7092f943bed6f7c584",
  "src/components/GTMHead.astro": "185bd5e9defe59a60056e2a52661a6761deac4d24c5949d8034feec3e79765d1",
  "src/components/GTMBody.astro": "2058af65086794bdbc805d784ac1eeecf954004b7fce89dd466c4d9f16d9fb30",
  "src/styles/site-brand.css": "bdf56bcc5fcc3efb7dad7cda3a62bcc391963149e92f1c060a065207b1635090",
  "src/styles/site-primitives.css": "904be08e1f769ee5d1defa3bd0e041982355a6efdbec154672a68231c3c3a9ee",
  "src/styles/global.css": "25a3bef8e20689038a0881fe3946a124e5e71cd7eed113ac0a3832bae4b0f3b7",
  "src/pages/api/whatsapp-click.ts": "f9599ca8648190ec46d5a8058b57c1b0571a6a492cbf4063c5ae604f19c8f7ad",
};

test("Piscinas is the explicit WP4 Landing Brand consumer", async () => {
  const source = await read("src/pages/lp/piscinas.astro");
  for (const pattern of [
    /import LandingLayout from '\.\.\/\.\.\/layouts\/LandingLayout\.astro'/,
    /visualMode="brand"/,
    /bodyClass="site-brand-lp-piscinas site-primitive-page"/,
    /<LPHeader slot="header" visualMode="brand"/,
    /<LPFooter slot="footer" visualMode="brand"/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b|\b(?:text|bg|color)-(?:piscina|marca|marca-suave|ouro)\b|--color-|Poppins|#[0-9a-f]{3,8}\b|gradient|glow|metallic/i);
});

test("Piscinas contains exactly the Founder-approved FAQ copy", async () => {
  const source = await read("src/pages/lp/piscinas.astro");
  const faq = source.match(/\{\[\s*\{ pergunta:([\s\S]*?)\]\.map\(\(item\) => \([\s\S]*?\)\)\}/);
  assert.ok(faq);
  const pairs = [...faq[0].matchAll(/\{ pergunta: '([^']+)', resposta: '([^']+)' \}/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual(pairs, EXPECTED_FAQ);
  assert.doesNotMatch(source, /Falar no WhatsApp|abrir-whatsapp-modal|<a\b[^>]*wa\.me/i);
});

test("Piscinas uses a first-party WhatsApp handoff without legacy lead egress", async () => {
  const [source, form, composer] = await Promise.all([
    read("src/pages/lp/piscinas.astro"),
    read("src/components/lp/PiscinasWhatsAppForm.astro"),
    read("src/utils/whatsapp-composer.ts"),
  ]);
  assert.match(source, /import PiscinasWhatsAppForm/);
  assert.match(source, /<PiscinasWhatsAppForm \/>/);
  assert.doesNotMatch(source, /FormularioGHL|StarterFunnels|starterfunnels|getCurrentEnvironmentContract/);
  assert.match(form, /data-piscinas-whatsapp-form/);
  assert.match(form, /name="nome"[^>]*required/);
  assert.match(form, /name="escala"/);
  assert.match(form, /name="prazo"/);
  assert.match(form, /name="consentimento"[^>]*required/);
  assert.match(form, /href="\/politica-de-privacidade"/);
  assert.match(form, /site:whatsapp-handoff-initiated/);
  assert.match(form, /componentRef: "lp_piscinas_whatsapp_form"/);
  assert.doesNotMatch(form, /fetch\(|\/api\/lead|\/obrigado|location\.(?:href|assign|replace)/);
  assert.match(composer, /composePiscinasProjectMessage/);
  assert.match(composer, /buildPiscinasWhatsAppUrl/);
  assert.match(composer, /ROYAL_WHATSAPP_NUMBER/);
});

test("Piscinas preserves metadata, conversion, integrations, and hero delivery", async () => {
  const source = await read("src/pages/lp/piscinas.astro");
  for (const pattern of [
    /title="Construção de Piscinas de Alto Padrão — Royal Splash"/,
    /description="Projeto e construção de piscinas personalizadas, borda infinita, iluminação LED e automação completa\."/,
    /robots="noindex, nofollow"/,
    /<link slot="head" rel="icon" type="image\/x-icon" href="\/favicon\.ico"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<PiscinasWhatsAppForm \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /<section id="orcamento"/,
    /href="#orcamento"[^>]*>Solicitar orçamento exclusivo<\/a>/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /import obra2 from '\.\.\/\.\.\/assets\/obra-2\.jpg'/,
    /src=\{obra2\} alt="Piscina iluminada em frente a uma residência contemporânea à noite" widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\} sizes="100vw" priority/,
  ]) assert.match(source, pattern);
  assert.equal((source.match(/href="#orcamento"/g) ?? []).length, 2);
  assert.match(source, /\.piscinas-cta \.site-primitive-section \{ display: block; \}/);
  assert.match(source, /\.piscinas-cta \.site-primitive-actions \{ margin-block-start: var\(--site-space-6\); \}/);
  assert.match(source, /\.piscinas-faq__layout \{[^}]*align-items: center;/);
});

test("WP4 changes no shared production capability", async () => {
  for (const [file, fingerprint] of Object.entries(sharedProductionFingerprints)) {
    assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
  }
});

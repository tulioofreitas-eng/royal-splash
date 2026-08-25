import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_VISIBLE_TEXT_SHA = "7d6f69164396056c83cc33e7a64e6ebada81adcafb2b2abee9e04de924b4423e";
const EXPECTED_VISIBLE_TEXT = "Construção de Piscinas de Alto Padrão — Royal Splash Piscina de alto padrão com projeto Alvenaria sob medida, borda infinita, prainha, aquecimento e automação. Solicitar orçamento exclusivo Nossos Serviços Projeto Personalizado Do conceito à planta executiva, desenhado sob medida pro seu terreno e estilo de vida. Por que a Royal Splash? Atendimento Premium Consultoria exclusiva do primeiro contato à entrega. Tecnologia de Ponta Automação, aquecimento e tratamento de última geração. Perguntas frequentes Vocês fazem o projeto ou preciso contratar arquiteto? Fazemos o projeto completo. Se você já tem arquiteto, trabalhamos em conjunto com ele. Pronto para transformar seu espaço em um refúgio de exclusividade? Falar com um especialista Solicite seu Orçamento Preencha os dados abaixo e nossa equipe entrará em contato para entender seu projeto em detalhes.";

function normalizedControlledRouteText(source) {
  let template = source.replace(/^---[\s\S]*?---\s*/, "").replace(/<style\b[\s\S]*?<\/style>/g, "");
  const title = template.match(/<LandingLayout\b[^>]*\btitle="([^"]+)"/)?.[1];
  assert.ok(title, "LandingLayout title must remain extractable");
  const faq = template.match(/\{\[\s*\{ pergunta:([\s\S]*?)\]\.map\(\(item\) => \([\s\S]*?\)\)\}/);
  assert.ok(faq, "Piscinas FAQ must remain a route-local mapped disclosure");
  const pairs = [...faq[0].matchAll(/\{ pergunta: '([^']+)', resposta: '([^']+)' \}/g)];
  assert.equal(pairs.length, 1, "Piscinas must retain its one controlled FAQ entry");
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
  "src/layouts/LandingLayout.astro": "d065e63e11aa8eb462ef1279170da87d3d9c8222dd77109b9a54eeffa4acd89c",
  "src/components/LPHeader.astro": "2c34178a5be4199471d5c8b071ce0368da1d7f075a8abc7a4736ce83cf152171",
  "src/components/LPFooter.astro": "4d67b1db7e6d246e3d031f6086218d971efc03ec90f23d7cf6b1cb3d5d408749",
  "src/components/FormularioGHL.astro": "2fb923c34600558a8d03bad47a446b18ea7b274919630fc1924ef2c116933e17",
  "src/components/BotaoWhatsapp.astro": "b17f5fadb21f5c3bdc6665fb34b9db7fb67693e01784189d1a34d1f80ecc7d2b",
  "src/components/GTMHead.astro": "185bd5e9defe59a60056e2a52661a6761deac4d24c5949d8034feec3e79765d1",
  "src/components/GTMBody.astro": "2058af65086794bdbc805d784ac1eeecf954004b7fce89dd466c4d9f16d9fb30",
  "src/styles/site-brand.css": "bdf56bcc5fcc3efb7dad7cda3a62bcc391963149e92f1c060a065207b1635090",
  "src/styles/site-primitives.css": "b62dff6981c74a2c0189af41f46d0d17cffa8a15cf5b7a7896dc447673b9dea7",
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

test("Piscinas preserves controlled copy except the authorized inline WhatsApp removal", async () => {
  const source = await read("src/pages/lp/piscinas.astro");
  const visibleText = normalizedControlledRouteText(source);
  assert.equal(visibleText, EXPECTED_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_VISIBLE_TEXT_SHA);
  assert.doesNotMatch(source, /Falar no WhatsApp|abrir-whatsapp-modal|<a\b[^>]*wa\.me/i);
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
    /<FormularioGHL \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /<section id="orcamento"/,
    /href="#orcamento"[^>]*>Solicitar orçamento exclusivo<\/a>/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /import obra2 from '\.\.\/\.\.\/assets\/obra-2\.jpg'/,
    /src=\{obra2\} alt="\.\.\." widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\} sizes="100vw" priority/,
  ]) assert.match(source, pattern);
  assert.equal((source.match(/href="#orcamento"/g) ?? []).length, 2);
});

test("WP4 changes no shared production capability", async () => {
  for (const [file, fingerprint] of Object.entries(sharedProductionFingerprints)) {
    assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
  }
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_VISIBLE_TEXT_SHA = "080d0c943021e956842d34c9bca07d9d9832a34850f132fae96b0360e5e6b0f6";
const EXPECTED_VISIBLE_TEXT = "Sauna e Spa de Alto Padrão — Royal Splash Transforme sua casa em um refúgio de bem-estar Saunas e spas personalizados, com conforto e acabamento premium. Solicitar orçamento exclusivo Bem-estar em cada detalhe Projetamos saunas secas e a vapor, ofurôs e espaços de spa completos, integrados à arquitetura da sua casa. Materiais nobres, sistemas de aquecimento eficientes e acabamento impecável. Do projeto à instalação, cuidamos de cada etapa com a mesma excelência que aplicamos em nossas piscinas. Projetos sob medida Materiais e acabamentos premium Nossos Serviços Sauna Seca e a Vapor Projetos personalizados com sistemas de aquecimento. Spa e Ofurô Espaços completos de relaxamento, integrados à área de lazer. Por que a Royal Splash? Atendimento Premium Consultoria exclusiva do primeiro contato à entrega. Tecnologia de Ponta Sistemas de aquecimento e automação modernos. Pronto para criar seu espaço de bem-estar? Falar com um especialista Solicite seu Orçamento Preencha os dados abaixo e nossa equipe entrará em contato para entender seu projeto em detalhes.";

function normalizedControlledRouteText(source) {
  const template = source.replace(/^---[\s\S]*?---\s*/, "").replace(/<style\b[\s\S]*?<\/style>/g, "");
  const title = template.match(/<title>([^<]+)<\/title>/)?.[1]
    ?? template.match(/<LandingLayout\b[^>]*\btitle="([^"]+)"/)?.[1];
  assert.ok(title, "route title must remain extractable before and after migration");
  const body = template
    .replace(/<head\b[\s\S]*?<\/head>/, " ")
    .replace(/<LPFooter\b[^>]*\/>/g, " ")
    .replace(/<BotaoWhatsapp\b[^>]*\/>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title} ${body}`;
}

const frozenSources = {
  "src/pages/lp/lazer.astro": "5a0cb846d6e5acb47d2f00b1c6d6cbd2041bb8a27c32fd1248f25ce1dc47838a",
  "src/pages/lp/piscinas.astro": "cdb98174ac9cdcdbbcbf964d4eaf99cef028f9eea599c17ccd5dbcce0df8dbaa",
  "src/layouts/LandingLayout.astro": "d065e63e11aa8eb462ef1279170da87d3d9c8222dd77109b9a54eeffa4acd89c",
  "src/components/LPHeader.astro": "2c34178a5be4199471d5c8b071ce0368da1d7f075a8abc7a4736ce83cf152171",
  "src/components/LPFooter.astro": "4d67b1db7e6d246e3d031f6086218d971efc03ec90f23d7cf6b1cb3d5d408749",
  "src/components/GaleriaZoom.astro": "de0a37cf01c4e89fd73254f0b2fa61aa2db425d38ea5c1605a8734538711f328",
  "src/components/FormularioGHL.astro": "2fb923c34600558a8d03bad47a446b18ea7b274919630fc1924ef2c116933e17",
  "src/components/BotaoWhatsapp.astro": "b17f5fadb21f5c3bdc6665fb34b9db7fb67693e01784189d1a34d1f80ecc7d2b",
  "src/styles/site-brand.css": "bdf56bcc5fcc3efb7dad7cda3a62bcc391963149e92f1c060a065207b1635090",
  "src/styles/site-primitives.css": "b62dff6981c74a2c0189af41f46d0d17cffa8a15cf5b7a7896dc447673b9dea7",
  "src/styles/global.css": "25a3bef8e20689038a0881fe3946a124e5e71cd7eed113ac0a3832bae4b0f3b7",
};

test("Sauna is the sole authorized WP3A media-rich Brand consumer", async () => {
  const source = await read("src/pages/lp/sauna.astro");
  for (const pattern of [
    /import LandingLayout from '\.\.\/\.\.\/layouts\/LandingLayout\.astro'/,
    /visualMode="brand"/,
    /bodyClass="[^"]*site-primitive-page[^"]*"/,
    /<LPHeader slot="header" visualMode="brand"/,
    /<LPFooter slot="footer" visualMode="brand"/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b/);
  assert.doesNotMatch(source, /\b(?:text|bg|color)-(?:piscina|marca|marca-suave|ouro)\b|--color-|Poppins|#[0-9a-f]{3,8}\b|gradient|glow|metallic/i);
  await assert.rejects(access(path.join(ROOT, "src/pages/lp/reparo-subaquatico.astro")));
});

test("Sauna preserves metadata, tracking, conversion providers, and CTAs", async () => {
  const source = await read("src/pages/lp/sauna.astro");
  for (const pattern of [
    /title="Sauna e Spa de Alto Padrão — Royal Splash"/,
    /description="Construção e instalação de saunas e spas personalizados\. Conforto e bem-estar\."/,
    /robots="noindex, nofollow"/,
    /<link slot="head" rel="icon" type="image\/x-icon" href="\/favicon\.ico"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<FormularioGHL \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Solicitar orçamento exclusivo<\/a>/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
  ]) assert.match(source, pattern);
  assert.equal((source.match(/href="#orcamento"/g) ?? []).length, 2);
  assert.doesNotMatch(source, /abrir-whatsapp-modal|inicie-seu-projeto|<a\b[^>]*whatsapp/i);
});

test("Sauna preserves responsive hero and exact GaleriaZoom media semantics", async () => {
  const source = await read("src/pages/lp/sauna.astro");
  assert.match(source, /src=\{servicoSauna\} alt="Sauna e spa de alto padrão" widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\} sizes="100vw" priority/);
  assert.match(source, /<GaleriaZoom imagens=\{\[\s*\{ src: saunaInterior, alt: 'Sauna residencial de alto padrão' \},\s*\{ src: saunaSpa, alt: 'Spa e ofurô' \},\s*\{ src: saunaEspacoIntegrado, alt: 'Espaço integrado de spa' \},\s*\{ src: saunaAquecedor, alt: 'Detalhe do aquecedor de sauna' \},\s*\]\} \/>/);
  for (const asset of ["servicoSauna", "saunaInterior", "saunaSpa", "saunaAquecedor", "saunaEspacoIntegrado"]) assert.match(source, new RegExp(`import ${asset} from`));
  assert.doesNotMatch(source, /lightbox-img|galeria-zoom-item|querySelector/);
});

test("Sauna normalized visible copy is byte-equivalent to its pre-mutation baseline", async () => {
  const visibleText = normalizedControlledRouteText(await read("src/pages/lp/sauna.astro"));
  assert.equal(visibleText, EXPECTED_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_VISIBLE_TEXT_SHA);
});

test("Sauna introduces no new proof or claim categories", async () => {
  const source = await read("src/pages/lp/sauna.astro");
  assert.doesNotMatch(source, /cliente|case study|estudo de caso|portf[oó]lio|certificad|garantia|SLA|depoimento|before|after|antes\/depois/i);
});

test("GaleriaZoom and every protected shared or held production source retain pre-mutation fingerprints", async () => {
  for (const [file, fingerprint] of Object.entries(frozenSources)) assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
});

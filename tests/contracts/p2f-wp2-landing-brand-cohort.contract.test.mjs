import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_VISIBLE_TEXT_SHA = "b1f049bbe9c9bf24c926bd84753b4dbc6ab2474bd1112b4c6570a4fcfa4be891";
const EXPECTED_VISIBLE_TEXT = "Detecção de Vazamento em Piscinas — Royal Splash Sua piscina está perdendo água? Detecção de Vazamentos Piscina perdendo nível de água constantemente? Pode ser vazamento estrutural, em tubulação ou no revestimento. Como Trabalhamos Reparo Correção estrutural, de tubulação ou revestimento, sem gambiarra. Por que a Royal Splash? Tecnologia de Ponta Atendimento Premium Consultoria clara do diagnóstico à entrega. Não deixe o vazamento aumentar sua conta de água Falar com um especialista Solicite seu Orçamento Preencha os dados abaixo e nossa equipe entrará em contato para entender seu caso em detalhes.";
const EXPECTED_REFORMA_VISIBLE_TEXT_SHA = "ea6fae1a2588affd341c08c308ee0c9b6b24b0a0662c11ddb9c05c4ca9d90422";
const EXPECTED_REFORMA_VISIBLE_TEXT = "Reforma de Piscinas — Royal Splash Sua piscina perdeu o brilho? Nós devolvemos Reforma completa com novos revestimentos, iluminação e automação. Transforme sua piscina antiga em um espaço premium. Revitalização em cada detalhe Piscina antiga, revestimento desgastado ou sistema ultrapassado? Fazemos a reforma completa: novo acabamento, iluminação LED, automação e modernização estrutural. Novos revestimentos e acabamentos Modernização de iluminação e automação Cuidamos de cada detalhe da reforma. Modernize, não só reforme Trocar o revestimento resolve a aparência. Modernizar transforma a experiência. Na mesma obra, sua piscina pode ganhar: Iluminação LED subaquática — a piscina vira o centro da casa à noite Nossos Serviços Revestimento Novo Troca completa de acabamento, com materiais de alto padrão. Automação e Iluminação Sistemas modernos de controle, aquecimento e iluminação LED. Por que a Royal Splash? Atendimento Premium Consultoria exclusiva do primeiro contato à entrega. Tecnologia de Ponta Automação, aquecimento e tratamento de última geração. Dê nova vida à sua piscina antes do verão Falar com um especialista Solicite seu Orçamento Preencha os dados abaixo e nossa equipe entrará em contato para entender seu projeto em detalhes.";
const EXPECTED_CORPORATIVO_VISIBLE_TEXT_SHA = "9e6847cd3b81af7035f28d14506daf74bcf5d9092ece88255564d2548f1448a9";
const EXPECTED_CORPORATIVO_VISIBLE_TEXT = "Soluções Corporativas em Piscinas — Royal Splash Piscinas e áreas de lazer para elevar o padrão do seu negócio Soluções completas para hotéis, resorts, clubes e academias, do projeto à manutenção. Solicitar proposta sob medida Soluções para o seu negócio Infraestrutura profissional, acabamento de padrão internacional e operação sem interrupções. Piscinas Olímpicas e Complexos Aquáticos Projetamos e executamos piscinas semiolímpicas, olímpicas e recreativas, para clubes, escolas, academias e centros esportivos. Áreas de Lazer para Hotéis e Resorts Transformamos ambientes externos em diferenciais de experiência para os hóspedes: piscinas sofisticadas, spas, saunas, decks e áreas molhadas. Paisagismo integrado, com padrão internacional de acabamento. Manutenção Expressa Recuperação emergencial da qualidade da água para estabelecimentos que não podem parar. Técnicas avançadas e produtos específicos. Por que empresas confiam na Royal Splash? Atendimento Dedicado Consultoria exclusiva do projeto à entrega. Padrão Internacional Acabamento e tecnologia à altura da sua marca. Vamos elevar o padrão do seu negócio? Falar com nossa equipe Solicite uma Proposta Preencha os dados abaixo e nossa equipe entrará em contato para entender seu projeto em detalhes.";

function normalizedControlledRouteText(source) {
  const template = source
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/<style\b[\s\S]*?<\/style>/g, "");
  const title = template.match(/<title>([^<]+)<\/title>/)?.[1]
    ?? template.match(/<LandingLayout\b[^>]*\btitle="([^"]+)"/)?.[1];
  assert.ok(title, "route title must remain extractable before and after migration");
  const controlledBody = template
    .replace(/<head\b[\s\S]*?<\/head>/, " ")
    .replace(/<LPFooter\b[^>]*\/>/g, " ")
    .replace(/<BotaoWhatsapp\b[^>]*\/>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title} ${controlledBody}`;
}

const protectedFingerprints = {
  "src/pages/lp/lazer.astro": "5a0cb846d6e5acb47d2f00b1c6d6cbd2041bb8a27c32fd1248f25ce1dc47838a",
  "src/pages/lp/piscinas.astro": "cdb98174ac9cdcdbbcbf964d4eaf99cef028f9eea599c17ccd5dbcce0df8dbaa",
  "src/pages/lp/fibra.astro": "c53ec1dbf7afcbd3dd35deaa1368db3d9104ba2d7bdde050d1ad4e18b9368e03",
  "src/layouts/LandingLayout.astro": "d065e63e11aa8eb462ef1279170da87d3d9c8222dd77109b9a54eeffa4acd89c",
  "src/components/LPHeader.astro": "2c34178a5be4199471d5c8b071ce0368da1d7f075a8abc7a4736ce83cf152171",
  "src/components/LPFooter.astro": "4d67b1db7e6d246e3d031f6086218d971efc03ec90f23d7cf6b1cb3d5d408749",
  "src/styles/site-brand.css": "bdf56bcc5fcc3efb7dad7cda3a62bcc391963149e92f1c060a065207b1635090",
  "src/styles/site-primitives.css": "b62dff6981c74a2c0189af41f46d0d17cffa8a15cf5b7a7896dc447673b9dea7",
  "src/components/FormularioGHL.astro": "2fb923c34600558a8d03bad47a446b18ea7b274919630fc1924ef2c116933e17",
  "src/components/BotaoWhatsapp.astro": "b17f5fadb21f5c3bdc6665fb34b9db7fb67693e01784189d1a34d1f80ecc7d2b",
  "src/styles/global.css": "25a3bef8e20689038a0881fe3946a124e5e71cd7eed113ac0a3832bae4b0f3b7",
  "src/components/site/StructuredIntake.astro": "240959ce17eee75f4086d4f8156a3c45ed75616282036179257fc98e920e93fa",
  "src/pages/api/lead.ts": "e319eb440bf41ff668e3836a321d0535844ce8cbb20cf0df8db1d18137852230",
  "src/pages/api/site-lead-preview.ts": "08133ca784eaf7a0f230ba7bea4aa8d8555eea7110afd45c21961f124e1d2dd4",
  "tests/browser/structured-intake.spec.ts": "c106b97fe89d9542106ead5d2ab947e5ae1bc63c0032f48977af20805a9b2f4a",
  "tests/contracts/lead-ingress.contract.test.mjs": "7f625f8e5cc8cf7b18cbb876db3ebafc0f797c77d9eea42e222137fcf4051570",
  "tests/contracts/mock-lead-ingress-adapter.contract.test.mjs": "bb910e0d978bbd5a49c57ef93da434ce9f311f4892a0c440707df947332251f0",
  "tests/safety/site-lead-preview-route.test.mjs": "01d522e4d85899958871bedb659634c319963ca56c4491cd58a99a0cac51c228",
};

test("WP2 landing cohort has exactly the authorized migration state", async () => {
  const vazamento = await read("src/pages/lp/vazamento.astro");
  const fibra = await read("src/pages/lp/fibra.astro");
  const reforma = await read("src/pages/lp/reforma.astro");
  const corporativo = await read("src/pages/lp/corporativo.astro");
  const sauna = await read("src/pages/lp/sauna.astro");
  for (const source of [vazamento, fibra, reforma, corporativo, sauna]) {
    assert.match(source, /import LandingLayout/);
    assert.match(source, /visualMode="brand"/);
  }
  for (const file of ["lazer", "piscinas"]) {
    const source = await read(`src/pages/lp/${file}.astro`);
    assert.doesNotMatch(source, /import LandingLayout|visualMode="brand"/);
  }
  await assert.rejects(access(path.join(ROOT, "src/pages/lp/reparo-subaquatico.astro")));
});

test("vazamento preserves controlled copy without introducing claims or proof", async () => {
  const source = await read("src/pages/lp/vazamento.astro");
  const visibleText = normalizedControlledRouteText(source);
  assert.equal(visibleText, EXPECTED_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_VISIBLE_TEXT_SHA);
  assert.doesNotMatch(source, /<ul\b|text-piscina|color-piscina|bg-piscina/);
});

test("vazamento preserves metadata, conversion, tracking, providers, and image delivery", async () => {
  const source = await read("src/pages/lp/vazamento.astro");
  for (const pattern of [
    /title="Detecção de Vazamento em Piscinas — Royal Splash"/,
    /description="Sua piscina está perdendo água\? Detectamos e reparamos vazamentos\."/,
    /robots="noindex, nofollow"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<FormularioGHL \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /import servicoVazamento from '\.\.\/\.\.\/assets\/servico-vazamento\.jpg'/,
    /widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\}/,
    /sizes="100vw"/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b/);
});

test("reforma preserves actual controlled copy without inventing evidence", async () => {
  const source = await read("src/pages/lp/reforma.astro");
  const visibleText = normalizedControlledRouteText(source);
  assert.equal(visibleText, EXPECTED_REFORMA_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_REFORMA_VISIBLE_TEXT_SHA);
  assert.doesNotMatch(source, /Antes\/depois|before|after|carousel|gallery/i);
  assert.doesNotMatch(source, /text-piscina|color-piscina|bg-piscina/);
});

test("reforma preserves metadata, conversion, tracking, providers, and image delivery", async () => {
  const source = await read("src/pages/lp/reforma.astro");
  for (const pattern of [
    /title="Reforma de Piscinas — Royal Splash"/,
    /description="Sua piscina perdeu o brilho\? Revitalizamos com acabamento premium, novos revestimentos e automação\."/,
    /robots="noindex, nofollow"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<FormularioGHL \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /import servicoReforma from '\.\.\/\.\.\/assets\/servico-reforma\.jpg'/,
    /widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\}/,
    /sizes="100vw"/,
    /<LPHeader slot="header" visualMode="brand"/,
    /<LPFooter slot="footer" visualMode="brand"/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b|\bbg-marca\b|\bbg-marca-suave\b/);
});

test("corporativo preserves actual controlled copy without amplifying proof", async () => {
  const source = await read("src/pages/lp/corporativo.astro");
  const visibleText = normalizedControlledRouteText(source);
  assert.equal(visibleText, EXPECTED_CORPORATIVO_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_CORPORATIVO_VISIBLE_TEXT_SHA);
  assert.doesNotMatch(source, /cliente|case study|estudo de caso|portfolio|portfólio|certificad|garantia|SLA|before|after|antes\/depois/i);
  assert.doesNotMatch(source, /text-piscina|color-piscina|bg-piscina|bg-marca|bg-marca-suave/);
});

test("corporativo preserves metadata, conversion, integrations, and responsive editorial media", async () => {
  const source = await read("src/pages/lp/corporativo.astro");
  for (const pattern of [
    /import LandingLayout from '\.\.\/\.\.\/layouts\/LandingLayout\.astro'/,
    /title="Soluções Corporativas em Piscinas — Royal Splash"/,
    /description="Piscinas olímpicas, áreas de lazer para hotéis e manutenção expressa\. Soluções para hotéis, resorts, clubes e academias\."/,
    /robots="noindex, nofollow"/,
    /visualMode="brand"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<LPHeader slot="header" visualMode="brand"/,
    /<LPFooter slot="footer" visualMode="brand"/,
    /<FormularioGHL \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Solicitar proposta sob medida<\/a>/,
    /href="#orcamento"[^>]*>Falar com nossa equipe<\/a>/,
    /<link slot="head" rel="icon" type="image\/x-icon" href="\/favicon\.ico"/,
    /import corpOlimpica from '\.\.\/\.\.\/assets\/corp-olimpica\.jpg'/,
    /import corpHotel from '\.\.\/\.\.\/assets\/corp-hotel\.jpg'/,
    /import corpManutencao from '\.\.\/\.\.\/assets\/corp-manutencao\.jpg'/,
    /src=\{corpHotel\} alt="Áreas de lazer corporativas" widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\} sizes="100vw" priority/,
  ]) assert.match(source, pattern);
  for (const pattern of [
    /src=\{corpOlimpica\} alt="Piscinas olímpicas e complexos aquáticos" widths=\{\[340, 480, 640, 768, 960\]\} sizes="\(min-width: 1072px\) 480px, \(min-width: 768px\) calc\(50vw - 3\.5rem\), calc\(100vw - 3rem\)"/,
    /src=\{corpHotel\} alt="Áreas de lazer para hotéis e resorts" widths=\{\[340, 480, 640, 768, 960\]\} sizes="\(min-width: 1072px\) 480px, \(min-width: 768px\) calc\(50vw - 3\.5rem\), calc\(100vw - 3rem\)"/,
    /src=\{corpManutencao\} alt="Manutenção expressa de piscinas" widths=\{\[340, 480, 640, 768, 960\]\} sizes="\(min-width: 1072px\) 480px, \(min-width: 768px\) calc\(50vw - 3\.5rem\), calc\(100vw - 3rem\)"/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b/);
});

test("shared production, protected routes, and P2E surfaces retain frozen fingerprints", async () => {
  for (const [file, fingerprint] of Object.entries(protectedFingerprints)) {
    assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
  }
});

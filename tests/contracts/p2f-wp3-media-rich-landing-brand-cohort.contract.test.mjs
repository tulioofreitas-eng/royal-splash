import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_VISIBLE_TEXT_SHA = "7bee97ca4f1eeb0de785eeb8e0ee3f05ca433ffda01320ed3be14d7018cf867a";
const EXPECTED_VISIBLE_TEXT = "Sauna e Spa de Alto Padrão — Royal Splash Transforme sua casa em um refúgio de bem-estar Saunas e spas personalizados, com conforto e acabamento premium. Solicitar orçamento exclusivo Bem-estar em cada detalhe Projetamos saunas secas e a vapor, ofurôs e espaços de spa completos, integrados à arquitetura da sua casa. Materiais nobres, sistemas de aquecimento eficientes e acabamento impecável. Do projeto à instalação, cuidamos de cada etapa com a mesma excelência que aplicamos em nossas piscinas. Projetos sob medida Materiais e acabamentos premium Nossos Serviços Sauna Seca e a Vapor Projetos personalizados com sistemas de aquecimento. Spa e Ofurô Espaços completos de relaxamento, integrados à área de lazer. Por que a Royal Splash? Atendimento Premium Consultoria exclusiva do primeiro contato à entrega. Tecnologia de Ponta Sistemas de aquecimento e automação modernos. Perguntas frequentes Qual a diferença entre sauna seca e a vapor? A sauna seca utiliza calor gerado por pedras ou resistências, oferecendo um ambiente de baixa umidade. A sauna a vapor funciona com geradores dedicados, proporcionando alta umidade e calor envolvente. É possível integrar a sauna ou spa a um ambiente existente? Sim. Avaliamos a estrutura atual da sua área de lazer ou residência para adequar equipamentos e revestimentos de forma harmônica. Quais tipos de acabamentos são utilizados? Trabalhamos com materiais nobres como madeiras selecionadas para saunas secas e pedras ou pastilhas premium para saunas a vapor e spas. O projeto inclui os sistemas de aquecimento? Sim. Projetamos a infraestrutura completa, especificando e instalando os geradores de vapor ou aquecedores adequados para o volume do seu ambiente. Como solicitar um orçamento ou avaliação? Preencha o formulário desta página com o contexto do seu espaço. Nossa equipe iniciará uma conversa estruturada pelo WhatsApp para orientar os próximos passos. Pronto para criar seu espaço de bem-estar? Falar com um especialista Solicite seu Orçamento Preencha os dados abaixo e nossa equipe entrará em contato para entender seu projeto em detalhes.";
const EXPECTED_LAZER_VISIBLE_TEXT_SHA = "7c14a01ed259775a5d840f5e91d96ed21fbaa5a88783b585852ddd59351d0186";
const EXPECTED_LAZER_VISIBLE_TEXT = "Áreas de Lazer de Alto Padrão — Royal Splash Sua área de lazer completa, do projeto à entrega Piscina, deck, área gourmet e paisagismo integrados em um só projeto. Solicitar orçamento exclusivo Excelência em cada detalhe Uma área de lazer de verdade vai além da piscina: deck, área gourmet, paisagismo e iluminação integrados formam um espaço pensado pra viver, receber e relaxar. Cuidamos de todo o projeto — arquitetura, execução e acabamento — com o mesmo padrão de excelência em cada etapa. Projeto integrado (piscina, deck, gourmet) Paisagismo e iluminação sob medida Nossos Serviços Projeto Integrado Piscina, deck e área gourmet planejados como um conjunto. Paisagismo e Iluminação Integração dos elementos externos ao ambiente de lazer. Por que a Royal Splash? Atendimento Premium Consultoria exclusiva do primeiro contato à entrega. Conforto e Tecnologia Automação, aquecimento e iluminação integrados ao projeto conforme a necessidade de cada espaço. Perguntas frequentes O que está incluso no projeto de área de lazer? Piscina, deck, área gourmet, paisagismo e iluminação são planejados como um único projeto integrado — você recebe a visualização completa antes de aprovar. Preciso ter piscina pra contratar a área de lazer completa? Não. Também executamos deck, área gourmet e paisagismo separadamente, mesmo em espaços que já têm piscina pronta. Vocês cuidam do paisagismo também? Sim. Paisagismo e iluminação fazem parte do projeto integrado, pensados junto com a arquitetura de todo o espaço. É possível fazer em etapas, respeitando o orçamento? Sim. Planejamos o projeto completo, mas a execução pode ser dividida em etapas, de acordo com sua prioridade e orçamento. Como solicitar uma avaliação e orçamento? Preencha o formulário desta página para compartilhar seu contexto e receber o contato da equipe Royal Splash. Pronto para transformar sua área de lazer? Falar com um especialista Solicite seu Orçamento Compartilhe o contexto que já souber e abra uma conversa estruturada com a equipe Royal Splash pelo WhatsApp.";

function normalizedControlledRouteText(source) {
  let template = source.replace(/^---[\s\S]*?---\s*/, "").replace(/<style\b[\s\S]*?<\/style>/g, "");
  const title = template.match(/<title>([^<]+)<\/title>/)?.[1]
    ?? template.match(/<LandingLayout\b[^>]*\btitle="([^"]+)"/)?.[1];
  assert.ok(title, "route title must remain extractable before and after migration");
  const faq = template.match(/\{\[\s*\{ pergunta:([\s\S]*?)\]\.map\(\(item\) => \([\s\S]*?\)\)\}/);
  if (faq) {
    const pairs = [...faq[0].matchAll(/\{ pergunta: '([^']+)', resposta: '([^']+)' \}/g)];
    assert.equal(pairs.length, 5, "Lazer FAQ must retain five rendered question/answer pairs");
    template = template.replace(faq[0], pairs.flatMap((match) => [match[1], match[2]]).join(" "));
  }
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
  "src/pages/lp/piscinas.astro": "9a630509dbb638947483cac88bc91a51bb76df46fda8d55c21d06ecc54dd09f5",
  "src/pages/lp/sauna.astro": "f7a1d6aa0432df64ef10e7dc24063a8b6d15b02e8eb4514d29d5a4dfe1b21dce",
  "src/layouts/LandingLayout.astro": "7be577f229ec119b3f7669b2b5a326e7909f95c3769c53187568f9a2ff7fbd7b",
  "src/components/LPHeader.astro": "2c34178a5be4199471d5c8b071ce0368da1d7f075a8abc7a4736ce83cf152171",
  "src/components/LPFooter.astro": "4d67b1db7e6d246e3d031f6086218d971efc03ec90f23d7cf6b1cb3d5d408749",
  "src/components/GaleriaZoom.astro": "e1ce05442f569a8bea3f3613124b95f4a096b8a51d44d646f7035f9e78191520",
  "src/components/FormularioGHL.astro": "2fb923c34600558a8d03bad47a446b18ea7b274919630fc1924ef2c116933e17",
  "src/components/BotaoWhatsapp.astro": "b17f5fadb21f5c3bdc6665fb34b9db7fb67693e01784189d1a34d1f80ecc7d2b",
  "src/styles/site-brand.css": "bdf56bcc5fcc3efb7dad7cda3a62bcc391963149e92f1c060a065207b1635090",
  "src/styles/site-primitives.css": "904be08e1f769ee5d1defa3bd0e041982355a6efdbec154672a68231c3c3a9ee",
  "src/styles/global.css": "25a3bef8e20689038a0881fe3946a124e5e71cd7eed113ac0a3832bae4b0f3b7",
};

test("Sauna and Lazer are the explicit authorized WP3 media-rich Brand consumers", async () => {
  const source = await read("src/pages/lp/sauna.astro");
  const lazer = await read("src/pages/lp/lazer.astro");
  for (const consumer of [source, lazer]) {
    assert.match(consumer, /import LandingLayout from '\.\.\/\.\.\/layouts\/LandingLayout\.astro'/);
    assert.match(consumer, /visualMode="brand"/);
    assert.match(consumer, /bodyClass="[^"]*site-primitive-page[^"]*"/);
    assert.match(consumer, /<LPHeader slot="header" visualMode="brand"/);
    assert.match(consumer, /<LPFooter slot="footer" visualMode="brand"/);
    assert.doesNotMatch(consumer, /<main\b/);
    assert.doesNotMatch(consumer, /\b(?:text|bg|color)-(?:piscina|marca|marca-suave|ouro)\b|--color-|Poppins|#[0-9a-f]{3,8}\b|gradient|glow|metallic/i);
  }
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

test("Lazer preserves metadata, tracking, conversion providers, and CTAs", async () => {
  const source = await read("src/pages/lp/lazer.astro");
  for (const pattern of [
    /title="Áreas de Lazer de Alto Padrão — Royal Splash"/,
    /description="Projetamos e construímos áreas de lazer completas — piscina, deck, área gourmet e paisagismo\."/,
    /robots="noindex, nofollow"/,
    /<link slot="head" rel="icon" type="image\/x-icon" href="\/favicon\.ico"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<LazerWhatsAppForm \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Solicitar orçamento exclusivo<\/a>/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
  ]) assert.match(source, pattern);
  assert.equal((source.match(/href="#orcamento"/g) ?? []).length, 2);
  assert.doesNotMatch(source, /abrir-whatsapp-modal|inicie-seu-projeto|<a\b[^>]*whatsapp/i);
});

test("Lazer preserves responsive hero and exact GaleriaZoom media semantics", async () => {
  const source = await read("src/pages/lp/lazer.astro");
  assert.match(source, /src=\{servicoLazer\} alt="Área de lazer de alto padrão" widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\} sizes="100vw" priority/);
  assert.match(source, /<GaleriaZoom imagens=\{\[\s*\{ src: lazerGeral, alt: 'Área de lazer completa' \},\s*\{ src: lazerGourmet, alt: 'Área gourmet integrada' \},\s*\{ src: lazerDeck, alt: 'Deck e paisagismo' \},\s*\{ src: lazerNoturno, alt: 'Área de lazer à noite' \},\s*\]\} \/>/);
  for (const asset of ["servicoLazer", "lazerGeral", "lazerGourmet", "lazerDeck", "lazerNoturno"]) assert.match(source, new RegExp(`import ${asset} from`));
  assert.doesNotMatch(source, /lightbox-img|galeria-zoom-item|querySelector/);
});

test("Lazer preserves four route-local FAQ disclosures with exact controlled copy", async () => {
  const source = await read("src/pages/lp/lazer.astro");
  assert.equal((source.match(/<details class="lazer-faq__item">/g) ?? []).length, 1, "one mapped details template must render the controlled entries");
  assert.match(source, /<summary class="site-primitive-subtitle">/);
  assert.equal((source.match(/\{ pergunta:/g) ?? []).length, 5);
  for (const text of [
    "O que está incluso no projeto de área de lazer?",
    "Preciso ter piscina pra contratar a área de lazer completa?",
    "Vocês cuidam do paisagismo também?",
    "É possível fazer em etapas, respeitando o orçamento?",
    "Como solicitar uma avaliação e orçamento?",
    "Piscina, deck, área gourmet, paisagismo e iluminação são planejados como um único projeto integrado — você recebe a visualização completa antes de aprovar.",
    "Não. Também executamos deck, área gourmet e paisagismo separadamente, mesmo em espaços que já têm piscina pronta.",
    "Sim. Paisagismo e iluminação fazem parte do projeto integrado, pensados junto com a arquitetura de todo o espaço.",
    "Sim. Planejamos o projeto completo, mas a execução pode ser dividida em etapas, de acordo com sua prioridade e orçamento.",
    "Preencha o formulário desta página para compartilhar seu contexto e receber o contato da equipe Royal Splash.",
  ]) assert.ok(source.includes(text));
  assert.doesNotMatch(source, /FAQPage|application\/ld\+json/);
});

test("Lazer normalized visible copy is byte-equivalent to its pre-mutation baseline", async () => {
  const visibleText = normalizedControlledRouteText(await read("src/pages/lp/lazer.astro"));
  assert.equal(visibleText, EXPECTED_LAZER_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_LAZER_VISIBLE_TEXT_SHA);
});

test("Lazer introduces no new proof or claim categories", async () => {
  const source = await read("src/pages/lp/lazer.astro");
  assert.doesNotMatch(source, /cliente|case study|estudo de caso|portf[oó]lio|certificad|garantia|SLA|depoimento|before|after|antes\/depois/i);
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
    /<SaunaWhatsAppForm \/>/,
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

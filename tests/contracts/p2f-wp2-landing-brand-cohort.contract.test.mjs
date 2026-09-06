import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_VISIBLE_TEXT_SHA = "bd9db082a5099c452b11a032ee30bc15846bfb840f11768cbf3f1d1786ee4d59";
const EXPECTED_VISIBLE_TEXT = "Detecção de Vazamento em Piscinas — Royal Splash Sua piscina está perdendo água? Investigação completa para encontrar o vazamento e resolver com segurança e sem quebra desnecessária. Solicitar orçamento exclusivo Investigação antes da intervenção Cada sinal de perda de água precisa ser avaliado de acordo com as características da piscina. A investigação ajuda a identificar indícios e possíveis fontes do problema antes da definição da intervenção mais adequada. Investigação da estrutura, tubulação e revestimento Intervenção definida de acordo com cada situação Nossos Serviços Investigação e Diagnóstico Avaliação técnica para identificar indícios e possíveis fontes de perda de água na estrutura, tubulação ou revestimento. Reparo e Intervenção Definição e execução da correção estrutural ou hidráulica adequada para o seu caso. Por que a Royal Splash? Avaliação Cuidadosa Análise criteriosa para definir a intervenção mais adequada para a sua piscina. Orientação Clara Transparência em todas as etapas, do diagnóstico inicial até a conclusão do reparo. Perguntas frequentes {[ { pergunta: 'Quais são os sinais de que minha piscina pode ter um vazamento?', resposta: 'Perda constante e anormal do nível de água, poças persistentes ao redor da piscina ou um aumento inexplicável na conta de água são os principais indícios.' }, { pergunta: 'A avaliação consegue localizar exatamente onde está o problema?', resposta: 'Nossa investigação técnica busca identificar indícios e delimitar a área do problema. A precisão depende do tipo de estrutura, tubulação e acabamento.' }, { pergunta: 'É sempre necessário quebrar o revestimento?', resposta: 'Depende do diagnóstico. Alguns reparos em tubulações externas ou equipamentos são mais simples, enquanto vazamentos estruturais profundos podem exigir intervenções no revestimento ou piso.' }, { pergunta: 'A Royal Splash também faz o reparo?', resposta: 'Sim, realizamos tanto a investigação inicial quanto a intervenção corretiva, oferecendo uma solução integrada para a sua piscina.' }, { pergunta: 'Como solicitar uma avaliação técnica?', resposta: 'Preencha o formulário desta página com os sintomas observados. Nossa equipe iniciará uma conversa pelo WhatsApp para orientar os próximos passos.' }, ].map((item) => ( {item.pergunta} + {item.resposta} ))} Não deixe o vazamento aumentar sua conta de água Falar com um especialista Solicite seu Orçamento Preencha os dados abaixo e nossa equipe entrará em contato para entender seu caso em detalhes.";
const EXPECTED_REFORMA_VISIBLE_TEXT_SHA = "33f69430c8fd3cb2c912b0f8e90e3cdc25608ba8cb4f74f3ef9c40fbbe944b47";
const EXPECTED_REFORMA_VISIBLE_TEXT = "Reforma de Piscinas — Royal Splash Reforma de piscinas em cada detalhe Novos revestimentos, iluminação, aquecimento e automação para renovar piscinas existentes. Solicitar avaliação Renovação em cada detalhe Transformamos sua piscina atual em um espaço moderno e sofisticado. Novos revestimentos, atualização de iluminação e automação para trazer conforto e um visual premium ao que já existe. Modernização de revestimentos e acabamentos Atualização tecnológica de luz e calor Nossos Serviços Revestimentos e acabamentos Renovação do revestimento e do acabamento da piscina existente. Iluminação e aquecimento Atualização da iluminação e do aquecimento conforme o contexto da reforma. Automação e modernização Integração de controle e modernização dos recursos da piscina. Por que a Royal Splash? Atendimento Premium Consultoria exclusiva do primeiro contato à entrega. Tecnologia de Ponta Automação, aquecimento e tratamento de última geração. Perguntas frequentes {[ { pergunta: 'Quais sinais indicam que uma piscina deve ser avaliada para reforma?', resposta: 'Revestimento desgastado, acabamento deteriorado e sistemas de iluminação, aquecimento ou automação desatualizados podem justificar uma avaliação.' }, { pergunta: 'É possível renovar o revestimento e o acabamento?', resposta: 'Sim. A renovação de revestimentos e acabamentos faz parte do escopo de reforma. A condição existente precisa ser avaliada para definir a abordagem adequada.' }, { pergunta: 'A reforma pode incluir iluminação, aquecimento e automação?', resposta: 'Esses recursos podem ser considerados na reforma conforme o contexto, a condição existente e as necessidades da piscina.' }, { pergunta: 'Como é definido o escopo da reforma?', resposta: 'A equipe avalia a piscina existente e as necessidades apresentadas para entender o contexto e definir os próximos passos.' }, { pergunta: 'Como solicitar uma avaliação e orçamento?', resposta: 'Preencha o formulário desta página com seu nome e, se desejar, um breve contexto para abrir a conversa com a Royal Splash pelo WhatsApp.' }, ].map((item) => ( {item.pergunta} + {item.resposta} ))} Pronto para renovar sua piscina? Falar com um especialista Solicite seu Orçamento Compartilhe o contexto que já souber e abra uma conversa estruturada com a equipe Royal Splash pelo WhatsApp.";
const EXPECTED_CORPORATIVO_VISIBLE_TEXT_SHA = "dad7312fe83250025a4f3aa82a02a191857d452315273886ac97281d3e9a9715";
const EXPECTED_CORPORATIVO_VISIBLE_TEXT = "Soluções Corporativas em Piscinas — Royal Splash Soluções Corporativas Piscinas, spas e áreas de lazer de alto padrão para hotéis, resorts, clubes e academias. Falar com um especialista Estrutura e tecnologia para demandas empresariais A Royal Splash atende hotéis, clubes, resorts, escolas de natação e condomínios que exigem execução impecável, cumprimento rigoroso de cronograma e respeito às normas técnicas de segurança e acessibilidade. Projetos com padrão internacional Adequação a normas de acessibilidade Nossos Serviços Piscinas Olímpicas e Complexos Aquáticos Projetamos e executamos piscinas semiolímpicas, olímpicas e recreativas para clubes, escolas, academias e centros esportivos. Áreas de Lazer para Hotéis e Resorts Transformamos ambientes externos em diferenciais de experiência: piscinas, spas e saunas com paisagismo integrado. Substituição Submersa de Revestimentos Troca de azulejos e revestimentos com a piscina cheia, evitando esvaziamento e minimizando a interrupção da operação. Manutenção Expressa Recuperação emergencial da água com técnicas avançadas para estabelecimentos que não podem parar a operação. Por que empresas confiam na Royal Splash? Atendimento Dedicado Consultoria exclusiva do projeto à entrega. Padrão Internacional Acabamento e tecnologia à altura da sua marca. Perguntas frequentes {[ { pergunta: 'A Royal Splash atende projetos corporativos de que tipo?', resposta: 'A Royal Splash atende hotéis, clubes, resorts, escolas de natação e condomínios.' }, { pergunta: 'Vocês executam piscinas olímpicas e semiolímpicas?', resposta: 'Sim. Projetamos e executamos piscinas semiolímpicas, olímpicas e recreativas para academias e centros esportivos.' }, { pergunta: 'A Royal Splash oferece serviço de manutenção para empresas?', resposta: 'Sim. Oferecemos manutenção expressa e recuperação emergencial da qualidade da água para estabelecimentos que não podem parar.' }, { pergunta: 'O atendimento é exclusivo para o projeto?', resposta: 'Sim. Oferecemos consultoria exclusiva do projeto à entrega, com atendimento dedicado.' }, { pergunta: 'É possível trocar azulejos ou revestimentos sem esvaziar a piscina?', resposta: 'Sim. Nossa equipe realiza a substituição submersa de revestimentos com a piscina cheia, evitando o esvaziamento desnecessário e preservando a operação do ambiente.' }, ].map((item) => ( {item.pergunta} + {item.resposta} ))} Vamos elevar o padrão do seu negócio? Invista em estrutura e tecnologia corporativa com a Royal Splash. Falar com nossa equipe Solicite seu Orçamento Compartilhe o contexto que já souber e abra uma conversa estruturada com a equipe Royal Splash pelo WhatsApp.";

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
  "src/pages/lp/piscinas.astro": "9a630509dbb638947483cac88bc91a51bb76df46fda8d55c21d06ecc54dd09f5",
  "src/pages/lp/fibra.astro": "0f31f82486450503f92b186b1ad37fcd64ba4bd24e11f05f3fb7a7e8daeb6b1c",
  "src/layouts/LandingLayout.astro": "7be577f229ec119b3f7669b2b5a326e7909f95c3769c53187568f9a2ff7fbd7b",
  "src/components/LPHeader.astro": "2c34178a5be4199471d5c8b071ce0368da1d7f075a8abc7a4736ce83cf152171",
  "src/components/LPFooter.astro": "4d67b1db7e6d246e3d031f6086218d971efc03ec90f23d7cf6b1cb3d5d408749",
  "src/styles/site-brand.css": "bdf56bcc5fcc3efb7dad7cda3a62bcc391963149e92f1c060a065207b1635090",
  "src/styles/site-primitives.css": "904be08e1f769ee5d1defa3bd0e041982355a6efdbec154672a68231c3c3a9ee",
  "src/components/FormularioGHL.astro": "2fb923c34600558a8d03bad47a446b18ea7b274919630fc1924ef2c116933e17",
  "src/components/BotaoWhatsapp.astro": "4e2b8db201fd41d56f70e9fb187eb27a7e6835949fc66d7092f943bed6f7c584",
  "src/styles/global.css": "25a3bef8e20689038a0881fe3946a124e5e71cd7eed113ac0a3832bae4b0f3b7",
  "src/components/site/StructuredIntake.astro": "f4fa2c93a28bdb307530374885c17078eb56a1f08850d6410938067b5e2b4ce1",
  "src/pages/api/lead.ts": "e319eb440bf41ff668e3836a321d0535844ce8cbb20cf0df8db1d18137852230",
  "src/pages/api/site-lead-preview.ts": "84d272e897b11ab262218f267db4a72941df7941e00c019e64033d10e2daa1d9",
  "tests/browser/structured-intake.spec.ts": "f0e327e2c73e0b3ec2180bb4b71dc13a4ac3f58fcc31f8d3e3fc88263566bd92",
  "tests/contracts/lead-ingress.contract.test.mjs": "63e588dbbd8e4aac891ce3d4266a543f9c992810932aafa64b77b5dc36e585ee",
  "tests/contracts/mock-lead-ingress-adapter.contract.test.mjs": "bb910e0d978bbd5a49c57ef93da434ce9f311f4892a0c440707df947332251f0",
  "tests/safety/site-lead-preview-route.test.mjs": "01d522e4d85899958871bedb659634c319963ca56c4491cd58a99a0cac51c228",
};

test("WP2 landing cohort has exactly the authorized migration state", async () => {
  const vazamento = await read("src/pages/lp/vazamento.astro");
  const fibra = await read("src/pages/lp/fibra.astro");
  const reforma = await read("src/pages/lp/reforma.astro");
  const corporativo = await read("src/pages/lp/corporativo.astro");
  const sauna = await read("src/pages/lp/sauna.astro");
  const lazer = await read("src/pages/lp/lazer.astro");
  for (const source of [vazamento, fibra, reforma, corporativo, sauna, lazer]) {
    assert.match(source, /import LandingLayout/);
    assert.match(source, /visualMode="brand"/);
  }
  const piscinas = await read("src/pages/lp/piscinas.astro");
  assert.match(piscinas, /import LandingLayout/);
  assert.match(piscinas, /visualMode="brand"/);
  await assert.rejects(access(path.join(ROOT, "src/pages/lp/reparo-subaquatico.astro")));
});

test("vazamento preserves controlled copy without introducing claims or proof", async () => {
  const source = await read("src/pages/lp/vazamento.astro");
  const visibleText = normalizedControlledRouteText(source);
  assert.equal(visibleText, EXPECTED_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_VISIBLE_TEXT_SHA);
  assert.doesNotMatch(source, /text-piscina|color-piscina|bg-piscina/);
});

test("vazamento preserves metadata, conversion, tracking, providers, and image delivery", async () => {
  const source = await read("src/pages/lp/vazamento.astro");
  for (const pattern of [
    /title="Detecção de Vazamento em Piscinas — Royal Splash"/,
    /description="Sua piscina está perdendo água\? Detectamos e reparamos vazamentos\."/,
    /robots="noindex, nofollow"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<VazamentoWhatsAppForm \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /import heroVazamentoPanoramico from '\.\.\/\.\.\/assets\/vazamento-hero-panoramico\.png'/,
    /getImage\(\{ src: heroVazamentoPanoramico, format: 'webp', width: 2400 \}\)/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b/);
});

test("reforma preserves actual controlled copy without inventing evidence", async () => {
  const source = await read("src/pages/lp/reforma.astro");
  const visibleText = normalizedControlledRouteText(source);
  assert.equal(visibleText, EXPECTED_REFORMA_VISIBLE_TEXT);
  assert.equal(sha(visibleText), EXPECTED_REFORMA_VISIBLE_TEXT_SHA);
  assert.doesNotMatch(visibleText, /Antes\/depois|before|after|carousel|gallery/i);
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
    /<ReformaWhatsAppForm \/>/,
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
    /<CorporativoWhatsAppForm \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /href="#orcamento"[^>]*>Falar com nossa equipe<\/a>/,
    /<link slot="head" rel="icon" type="image\/x-icon" href="\/favicon\.ico"/,
    /import corpOlimpica from '\.\.\/\.\.\/assets\/corp-olimpica\.jpg'/,
    /import corpHotel from '\.\.\/\.\.\/assets\/corp-hotel\.jpg'/,
    /import corpManutencao from '\.\.\/\.\.\/assets\/corp-manutencao\.jpg'/,
    /import corpRevestimento from '\.\.\/\.\.\/assets\/corp-revestimento\.jpg'/,
    /src=\{corpHotel\} alt="Áreas de lazer corporativas" widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\} sizes="100vw" priority/,
  ]) assert.match(source, pattern);
  for (const pattern of [
    /<GaleriaZoom imagens=\{\[/,
    /\{ src: corpOlimpica, alt: 'Piscinas Olímpicas e Complexos Aquáticos' \}/,
    /\{ src: corpHotel, alt: 'Áreas de Lazer para Hotéis e Resorts' \}/,
    /\{ src: corpRevestimento, alt: 'Substituição Submersa de Revestimentos' \}/,
    /\{ src: corpManutencao, alt: 'Manutenção Expressa' \}/,
  ]) assert.match(source, pattern);
  assert.doesNotMatch(source, /<main\b/);
});

test("shared production, protected routes, and P2E surfaces retain frozen fingerprints", async () => {
  for (const [file, fingerprint] of Object.entries(protectedFingerprints)) {
    assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
  }
});

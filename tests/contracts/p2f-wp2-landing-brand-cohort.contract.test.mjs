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
  "src/pages/lp/reforma.astro": "f4153264a49b67a269b09b93a3f3a5f318900edafc8a1e9b4e4d5d1d41910ec5",
  "src/pages/lp/corporativo.astro": "277f2367c8df7b50281159c643fd606e9e63bdb54efc86046d8662259f1d7bb4",
  "src/pages/lp/lazer.astro": "5a0cb846d6e5acb47d2f00b1c6d6cbd2041bb8a27c32fd1248f25ce1dc47838a",
  "src/pages/lp/piscinas.astro": "cdb98174ac9cdcdbbcbf964d4eaf99cef028f9eea599c17ccd5dbcce0df8dbaa",
  "src/pages/lp/sauna.astro": "deb686c72b2abc27295f546bde522210bce2586fb103b102fde1d072ae7f47b8",
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
  for (const source of [vazamento, fibra]) {
    assert.match(source, /import LandingLayout/);
    assert.match(source, /visualMode="brand"/);
  }
  for (const file of ["reforma", "corporativo", "lazer", "piscinas", "sauna"]) {
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

test("shared production, protected routes, and P2E surfaces retain frozen fingerprints", async () => {
  for (const [file, fingerprint] of Object.entries(protectedFingerprints)) {
    assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
  }
});

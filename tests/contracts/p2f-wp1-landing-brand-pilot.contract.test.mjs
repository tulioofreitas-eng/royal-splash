import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFile(path.join(ROOT, file), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const EXPECTED_VISIBLE_TEXT_SHA = "8ee867a6afa0622b5eaaa8a1fae6c764fdf80f7e7e2c5d591114b35237552adc";
const EXPECTED_FIBRA_SOURCE_SHA = "c53ec1dbf7afcbd3dd35deaa1368db3d9104ba2d7bdde050d1ad4e18b9368e03";

function normalizedControlledRouteText(source) {
  const template = source
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/<style\b[\s\S]*?<\/style>/g, "");
  const title = template.match(/<LandingLayout\b[^>]*\btitle="([^"]+)"/)?.[1];
  assert.ok(title, "LandingLayout title must remain extractable from the migrated route");
  const visibleBodyText = template
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title} ${visibleBodyText}`;
}

const parity = {
  "src/pages/lp/lazer.astro": "5a0cb846d6e5acb47d2f00b1c6d6cbd2041bb8a27c32fd1248f25ce1dc47838a",
  "src/pages/lp/piscinas.astro": "cdb98174ac9cdcdbbcbf964d4eaf99cef028f9eea599c17ccd5dbcce0df8dbaa",
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

test("LandingLayout exposes explicit, default-functional Brand capability", async () => {
  const source = await read("src/layouts/LandingLayout.astro");
  assert.match(source, /data-template-family="landing"/);
  assert.match(source, /visualMode\s*=\s*"functional"/);
  assert.match(source, /data-site-visual=\{visualMode\}/);
  assert.match(source, /import "\.\.\/styles\/site-system\.css"/);
});

test("fibra remains the accepted WP1 landing Brand pilot", async () => {
  const fibra = await read("src/pages/lp/fibra.astro");
  assert.equal(sha(fibra), EXPECTED_FIBRA_SOURCE_SHA, "the accepted fibra pilot source drifted");
  assert.match(fibra, /import LandingLayout/);
  assert.match(fibra, /visualMode="brand"/);
  assert.doesNotMatch(fibra, /<main\b|text-piscina|color-piscina|bg-piscina/);
  for (const file of Object.keys(parity).filter((file) => file.startsWith("src/pages/lp/"))) {
    assert.doesNotMatch(await read(file), /import LandingLayout|visualMode="brand"/);
  }
  const sauna = await read("src/pages/lp/sauna.astro");
  assert.match(sauna, /import LandingLayout/);
  assert.match(sauna, /visualMode="brand"/);
});

test("controlled integrations, metadata, CTA, image delivery, and copy remain present", async () => {
  const source = await read("src/pages/lp/fibra.astro");
  for (const pattern of [
    /title="Restauração de Piscina de Fibra — Royal Splash"/,
    /description="Restauração de piscinas de fibra\."/,
    /robots="noindex, nofollow"/,
    /<GTMHead slot="head"/,
    /<GTMBody slot="body-start"/,
    /<FormularioGHL \/>/,
    /<BotaoWhatsapp slot="body-end"/,
    /href="#orcamento"[^>]*>Falar com um especialista<\/a>/,
    /widths=\{\[390, 640, 768, 1024, 1280, 1536, 1792, 2400\]\}/,
    /sizes="100vw"/,
  ]) assert.match(source, pattern);

  assert.equal(sha(normalizedControlledRouteText(source)), EXPECTED_VISIBLE_TEXT_SHA);
});

test("protected WP1 and P2E surfaces retain base fingerprints", async () => {
  for (const [file, fingerprint] of Object.entries(parity)) assert.equal(sha(await read(file)), fingerprint, `${file} drifted`);
});

test("held LP remains absent and Brand CSS stays explicitly scoped", async () => {
  await assert.rejects(access(path.join(ROOT, "src/pages/lp/reparo-subaquatico.astro")));
  const css = `${await read("src/styles/site-brand.css")}\n${await read("src/styles/site-primitives.css")}`;
  assert.match(css, /data-template-family="landing"/);
  assert.match(css, /data-site-visual="brand"/);
  assert.match(css, /data-template-family="site"/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|Poppins|piscina/i);
});

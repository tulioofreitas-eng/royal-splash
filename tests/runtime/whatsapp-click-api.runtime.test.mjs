import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiPath = new URL("../../src/pages/api/whatsapp-click.ts", import.meta.url);
const buttonPath = new URL("../../src/components/BotaoWhatsapp.astro", import.meta.url);

test("WhatsApp diagnostic endpoint never claims success after a failed insert", async () => {
  const code = await readFile(apiPath, "utf8");
  assert.match(code, /if \(error\)\s*\{[\s\S]*?jsonResponse\(503, \{ ok: false, error: "persistence_failed" \}\)/);
  assert.match(code, /console\.error\("royal_whatsapp_click_insert_failed"/);
  assert.match(code, /catch \{\s*console\.error\("royal_whatsapp_click_runtime_failed"\);\s*return jsonResponse\(503, \{ ok: false, error: "temporarily_unavailable" \}\)/);
});

test("no caller PII or raw provider error text is written to diagnostics", async () => {
  const code = await readFile(apiPath, "utf8");
  assert.match(code, /diagnosticCode\(error\.code\)/);
  assert.doesNotMatch(code, /console\.(?:error|warn|log)\([^;]*(?:error\.message|JSON\.stringify\(corpo\)|request\.headers)/);
});

test("legacy page-only click contract, mock isolation and nonblocking browser remain", async () => {
  const api = await readFile(apiPath, "utf8");
  const button = await readFile(buttonPath, "utf8");

  assert.match(api, /pagina = normalizeWhatsAppClickPage\(corpo\?\.pagina\)/);
  assert.match(api, /leadProvider === "mock"[\s\S]*?jsonResponse\(200, \{ ok: true, mock: true \}\)/);
  assert.match(api, /supabase\.from\("cliques_whatsapp"\)\.insert\(\{[\s\S]*?empresa_id: EMPRESA_ID,[\s\S]*?pagina,/);
  assert.match(button, /fetch\('\/api\/whatsapp-click',[\s\S]*?keepalive: true,[\s\S]*?\}\)\.catch/);
  assert.match(button, /registrarClique\(\);[\s\S]*?window\.open\(url, '_blank'\);/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { normalizeWhatsAppClickPage } from "../../src/growth/whatsapp-click.ts";
import { ROYAL_ROUTE_ROBOTS } from "../../src/seo/royal-policy.ts";
import { normalizeSiteLeadRequest } from "../../src/integrations/leads/normalize-site-lead-request.ts";

test("page-only capture accepts public routes and excludes PII, tokens and raw campaign values", () => {
  for (const path of Object.keys(ROYAL_ROUTE_ROBOTS)) assert.equal(normalizeWhatsAppClickPage(path), path);
  assert.equal(normalizeWhatsAppClickPage("/lp/fibra/"), "/lp/fibra");
  for (const value of [null, {}, 42, "Pessoa Teste", "person@example.com", "/person@example.com", "/5521999999999",
    "/lp/fibra?utm_campaign=private", "/lp/fibra#token", "https://www.royalsplash.com.br/lp/fibra", "/unknown", "x".repeat(300)]) {
    assert.equal(normalizeWhatsAppClickPage(value), null);
  }
});

// Execute the real handler with environment and persistence dependencies replaced.
// No production credentials, network, Supabase or Atlas calls are made.
async function handler(production, insert) {
  const file = new URL("../../src/pages/api/whatsapp-click.ts", import.meta.url);
  let source = await readFile(file, "utf8");
  source = source.replace(/import \{ getCurrentEnvironmentContract \} from "[^"]+";/,
    `const getCurrentEnvironmentContract = () => ({ isProduction: ${production}, leadProvider: "${production ? "production" : "mock"}" });`);
  source = source.replace(/from "(\.\.[^"]+)"/g, (_, path) => `from "${new URL(path, file).href}"`);
  source = source.replace('await import("../../safety/production-supabase.ts")',
    '({ createProductionSupabaseClient: async () => globalThis.__royalG4ETestClient })');
  globalThis.__royalG4ETestClient = { from(table) { assert.equal(table, "cliques_whatsapp"); return { insert }; } };
  const module = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(source))}`);
  return module.POST;
}

test("real production handler inserts only company and safe page; anonymous clicks cannot form Atlas intake", async () => {
  const records = [];
  const post = await handler(true, async record => { records.push(record); return { error: null }; });
  const body = { pagina: "/lp/fibra", correlationId: "RS-unpersisted", name: "Private Name", email: "private@example.com",
    attribution: { firstTouch: { campaignRef: "private-campaign" } } };
  const response = await post({ request: new Request("https://local/api/whatsapp-click", { method: "POST", body: JSON.stringify(body) }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(records, [{ empresa_id: "1f7b165c-0918-4090-a5a7-107560a05c55", pagina: "/lp/fibra" }]);
  assert.throws(() => normalizeSiteLeadRequest(body));
  delete globalThis.__royalG4ETestClient;
});

test("mock exits before persistence; malformed input and database failure remain non-blocking", async () => {
  const mock = await handler(false, () => { throw new Error("Persistence must not run"); });
  const mockResponse = await mock({ request: new Request("https://local/api/whatsapp-click", { method: "POST", body: "{" }) });
  assert.deepEqual(await mockResponse.json(), { ok: true, mock: true });
  const pages = [];
  const post = await handler(true, async record => { pages.push(record.pagina); return { error: null }; });
  for (const body of ["{", JSON.stringify({ pagina: "/email@example.com" })]) {
    assert.equal((await post({ request: new Request("https://local/api/whatsapp-click", { method: "POST", body }) })).status, 200);
  }
  assert.deepEqual(pages, [null, null]);
  const failing = await handler(true, async () => { throw new Error("Synthetic persistence failure"); });
  const originalError = console.error;
  try {
    console.error = () => {};
    assert.equal((await failing({ request: new Request("https://local/api/whatsapp-click", { method: "POST", body: "{}" }) })).status, 200);
  } finally { console.error = originalError; delete globalThis.__royalG4ETestClient; }
});

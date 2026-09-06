import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// RC01 Whatsapp GTM Event Bridge: whatsapp_click must reach GTM's dataLayer
// from the same recordWhatsAppClick/registrarClique observation points that
// already POST to /api/whatsapp-click, without altering that persistence
// call, and without ever emitting PII or duplicating the event for one
// physical handoff.

const analyticsUrl = new URL(
  "../../src/components/runtime/WhatsAppClickAnalytics.astro",
  import.meta.url,
);
const botaoUrl = new URL(
  "../../src/components/BotaoWhatsapp.astro",
  import.meta.url,
);

test("WhatsAppClickAnalytics emits exactly { event: \"whatsapp_click\" } with no PII", async () => {
  const source = await readFile(analyticsUrl, "utf8");

  assert.match(
    source,
    /dataLayer\.push\(\{\s*event:\s*"whatsapp_click"\s*\}\)/,
    "must push exactly { event: \"whatsapp_click\" } and nothing else",
  );

  assert.doesNotMatch(
    source,
    /dataLayer\.push\(\{[^}]*(pagina|nome|telefone|email|attribution|correlationId|utm_)/i,
    "dataLayer.push must never carry page path, contact fields or attribution tokens",
  );

  assert.match(
    source,
    /window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]|analyticsWindow\.dataLayer\s*=\s*analyticsWindow\.dataLayer\s*\|\|\s*\[\]/,
    "must safely initialize window.dataLayer before pushing",
  );
});

test("WhatsAppClickAnalytics preserves the existing POST /api/whatsapp-click contract untouched", async () => {
  const source = await readFile(analyticsUrl, "utf8");

  assert.match(
    source,
    /fetch\("\/api\/whatsapp-click",\s*\{\s*method:\s*"POST",\s*headers:\s*\{\s*"content-type":\s*"application\/json"\s*\},\s*body:\s*JSON\.stringify\(\{\s*pagina:\s*window\.location\.pathname\s*\}\),\s*keepalive:\s*true,\s*\}\)/,
    "the pre-existing whatsapp-click POST body/shape/keepalive must remain unchanged",
  );
});

test("WhatsAppClickAnalytics still observes raw wa.me anchor clicks and the LP handoff event", async () => {
  const source = await readFile(analyticsUrl, "utf8");

  assert.match(
    source,
    /new URL\(anchor\.href\)\.hostname === "wa\.me"/,
    "raw wa.me anchor click detection must remain",
  );

  assert.match(
    source,
    /window\.addEventListener\(\s*"site:whatsapp-handoff-initiated",\s*recordWhatsAppClick,?\s*\)/,
    "the 7 LP forms' custom handoff event must remain observed",
  );
});

test("WhatsAppClickAnalytics guards a single handoff against a duplicate whatsapp_click emission", async () => {
  const source = await readFile(analyticsUrl, "utf8");

  assert.match(
    source,
    /__royalWhatsAppClickEventLastEmittedAt/,
    "must track when whatsapp_click was last emitted",
  );

  assert.match(
    source,
    /now\s*-\s*last\s*<\s*DUPLICATE_EVENT_WINDOW_MS/,
    "must skip the dataLayer push when a prior emission is within the duplicate window",
  );

  const emitterIndex = source.indexOf("emitWhatsAppClickEvent");
  const recordIndex = source.indexOf("const recordWhatsAppClick");
  assert.ok(
    emitterIndex > -1 && emitterIndex < recordIndex,
    "the dedupe-guarded emitter must be defined once, ahead of recordWhatsAppClick, so both observers share it",
  );
});

test("BotaoWhatsapp (floating button, present on all 7 LPs) also emits whatsapp_click under the same guard", async () => {
  const source = await readFile(botaoUrl, "utf8");

  assert.match(
    source,
    /dataLayer\.push\(\{\s*event:\s*'whatsapp_click'\s*\}\)/,
    "the floating WhatsApp button must emit the same whatsapp_click event",
  );

  assert.match(
    source,
    /__royalWhatsAppClickEventLastEmittedAt/,
    "must reuse the shared window-level duplicate-emission guard",
  );

  assert.doesNotMatch(
    source,
    /dataLayer\.push\(\{[^}]*(nome|telefone|tipo|pagina)/i,
    "the floating button's dataLayer.push must never carry the modal's name/phone/project-type fields",
  );

  const emitterIndex = source.indexOf("function emitWhatsAppClickEvent");
  const registrarIndex = source.indexOf("function registrarClique");
  assert.ok(
    emitterIndex > -1 && emitterIndex < registrarIndex,
    "emitWhatsAppClickEvent must be called from inside registrarClique, its only call site",
  );

  const registrarBody = source.slice(
    registrarIndex,
    source.indexOf("botoesAbrir.forEach"),
  );
  assert.match(
    registrarBody,
    /emitWhatsAppClickEvent\(\);/,
    "registrarClique must call the emitter before the unchanged /api/whatsapp-click POST",
  );

  assert.match(
    registrarBody,
    /fetch\('\/api\/whatsapp-click',\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{\s*pagina:\s*window\.location\.pathname\s*\}\),\s*\}\)/,
    "the pre-existing whatsapp-click POST from the floating button must remain unchanged",
  );
});

test("BotaoWhatsapp: consent, Atlas and lead-capture code paths are untouched by the GTM bridge", async () => {
  const source = await readFile(botaoUrl, "utf8");

  assert.match(source, /const MODAL_ATIVO = false;/, "modal activation flag must remain as-is");

  assert.match(
    source,
    /fetch\('\/api\/lead',\s*\{/,
    "the qualified-lead /api/lead POST inside the (currently disabled) modal flow must remain untouched",
  );

  const emitCallSites = source.match(/emitWhatsAppClickEvent\(\);/g) ?? [];
  assert.equal(
    emitCallSites.length,
    1,
    "emitWhatsAppClickEvent must be called from exactly one site (registrarClique), not from the modal's wa-enviar handler",
  );
});

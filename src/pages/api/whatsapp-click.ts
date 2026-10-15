export const prerender = false;

import type { APIRoute } from "astro";
import { resolveLeadProvider } from "../../safety/lead-provider.ts";
import { getCurrentEnvironmentContract } from "../../safety/runtime.ts";
import { normalizeWhatsAppClickPage } from "../../growth/whatsapp-click.ts";

// Royal Splash — fixed company ID, same as the legacy /api/lead route.
const EMPRESA_ID = "1f7b165c-0918-4090-a5a7-107560a05c55";
const MAX_BODY_BYTES = 1024;
const ALLOWED_PRODUCTION_HOSTS = new Set([
  "www.royalsplash.com.br",
  "royalsplash.com.br",
]);

type ClickError =
  | "invalid_request"
  | "unsupported_media_type"
  | "payload_too_large"
  | "forbidden_origin"
  | "persistence_failed"
  | "temporarily_unavailable";

function jsonResponse(
  status: number,
  body: { ok: boolean; mock?: boolean; error?: ClickError },
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function isAllowedSameOriginRequest(request: Request): boolean {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" ||
      !ALLOWED_PRODUCTION_HOSTS.has(url.hostname)) return false;
  // Origin and Sec-Fetch-Site are browser defense-in-depth, not authentication
  // or a substitute for edge rate limiting: scripts can forge both.
  if (request.headers.get("origin") !== url.origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite === null || fetchSite === "same-origin";
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength) ||
        Number(contentLength) > MAX_BODY_BYTES) {
      throw new Error("payload_too_large");
    }
  }
  if (!request.body) throw new Error("invalid_request");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        // Cancel only after taking the size decision; never buffer large data.
        await reader.cancel();
        throw new Error("payload_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("invalid_request");
  }
}

// Supabase/PostgREST codes only. Never log body, IP, contact data or SDK errors.
function diagnosticCode(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z0-9_]{1,12}$/.test(value)
    ? value
    : "UNSPECIFIED";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const environment = getCurrentEnvironmentContract();
    const leadProvider = resolveLeadProvider(environment, {
      mock: () => "mock" as const,
      production: () => "production" as const,
    });

    // Preview is mock-only: its URL and credentials cannot be reused to
    // authenticate against the Atlas production database.
    if (leadProvider === "production" && !isAllowedSameOriginRequest(request)) {
      return jsonResponse(403, { ok: false, error: "forbidden_origin" });
    }

    const contentType = request.headers.get("content-type")
      ?.split(";", 1)[0]?.trim().toLowerCase();
    if (contentType !== "application/json") {
      return jsonResponse(415, { ok: false, error: "unsupported_media_type" });
    }

    let body: unknown;
    try {
      body = await readBoundedJson(request);
    } catch (error) {
      return error instanceof Error && error.message === "payload_too_large"
        ? jsonResponse(413, { ok: false, error: "payload_too_large" })
        : jsonResponse(400, { ok: false, error: "invalid_request" });
    }

    // Fail closed: never write a row with null page or unexpected fields.
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        typeof (body as Record<string, unknown>).pagina !== "string") {
      return jsonResponse(400, { ok: false, error: "invalid_request" });
    }
    const pagina = normalizeWhatsAppClickPage(
      (body as Record<string, unknown>).pagina,
    );
    if (!pagina) {
      return jsonResponse(400, { ok: false, error: "invalid_request" });
    }

    if (leadProvider === "mock") {
      return jsonResponse(200, { ok: true, mock: true });
    }

    const { createRoyalWhatsAppClickSupabaseClient } =
      await import("../../safety/production-supabase.ts");
    const supabase = await createRoyalWhatsAppClickSupabaseClient();

    const { error } = await supabase.from("cliques_whatsapp").insert({
      empresa_id: EMPRESA_ID,
      pagina,
    });

    if (error) {
      console.error("royal_whatsapp_click_insert_failed", {
        code: diagnosticCode(error.code),
      });
      return jsonResponse(503, { ok: false, error: "persistence_failed" });
    }
    return jsonResponse(200, { ok: true });
  } catch {
    console.error("royal_whatsapp_click_runtime_failed");
    return jsonResponse(503, { ok: false, error: "temporarily_unavailable" });
  }
};

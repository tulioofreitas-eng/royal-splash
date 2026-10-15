export const prerender = false;

import type { APIRoute } from "astro";
import { resolveLeadProvider } from "../../safety/lead-provider.ts";
import { getCurrentEnvironmentContract } from "../../safety/runtime.ts";
import { normalizeWhatsAppClickPage } from "../../growth/whatsapp-click.ts";

// Royal Splash — mesmo id fixo já usado em /api/lead
const EMPRESA_ID = "1f7b165c-0918-4090-a5a7-107560a05c55";

function jsonResponse(
  status: number,
  body: { ok: boolean; mock?: boolean; error?: "persistence_failed" | "temporarily_unavailable" },
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Supabase/PostgREST codes are diagnostics, not raw DB error messages.
// Never log caller input, contact data, headers, tokens or provider exceptions.
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

    let pagina: string | null = null;
    try {
      const corpo = await request.json();
      pagina = normalizeWhatsAppClickPage(corpo?.pagina);
    } catch {
      // Preserve the existing contract: invalid/empty body records null page.
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
      // Measurement is best-effort. The browser must never wait for it
      // before opening WhatsApp, but diagnostics must not claim success.
      return jsonResponse(503, { ok: false, error: "persistence_failed" });
    }

    return jsonResponse(200, { ok: true });
  } catch {
    console.error("royal_whatsapp_click_runtime_failed");
    return jsonResponse(503, { ok: false, error: "temporarily_unavailable" });
  }
};

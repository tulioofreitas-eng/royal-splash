export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

// Royal Splash — mesmo id fixo já usado em /api/lead
const EMPRESA_ID = "1f7b165c-0918-4090-a5a7-107560a05c55";

export const POST: APIRoute = async ({ request }) => {
  try {
    let pagina: string | null = null;
    try {
      const corpo = await request.json();
      pagina = typeof corpo?.pagina === "string" ? corpo.pagina.slice(0, 255) : null;
    } catch {
      // corpo vazio/ inválido — segue sem página, não é motivo pra falhar
    }

    const supabase = createClient(
      import.meta.env.SUPABASE_URL!,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from("cliques_whatsapp").insert({
      empresa_id: EMPRESA_ID,
      pagina,
    });

    if (error) {
      console.error("Erro ao registrar clique:", error);
      // não falha pro usuário — contagem é "nice to have", nunca deve
      // travar a experiência de quem só quer chamar no WhatsApp
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (erro) {
    console.error("Erro no endpoint /api/whatsapp-click:", erro);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
};

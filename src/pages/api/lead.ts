export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

// Royal Splash — id fixo, buscado em `select id from empresas where nome = 'Royal Splash'`
const EMPRESA_ID = "1f7b165c-0918-4090-a5a7-107560a05c55";

const ORIGENS_VALIDAS = ["site", "indicacao", "instagram", "outro", "whatsapp"];

export const POST: APIRoute = async ({ request }) => {
  try {
    let campos: Record<string, string> = {};

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const corpo = await request.json();
      for (const [chave, valor] of Object.entries(corpo)) {
        campos[chave] = String(valor ?? "");
      }
    } else {
      const dados = await request.formData();
      for (const [chave, valor] of dados.entries()) {
        campos[chave] = String(valor);
      }
    }

    if (campos.site_url) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const nome = (campos.nome ?? "").trim();
    const email = (campos.email ?? "").trim() || null;
    const telefone = (campos.telefone ?? "").trim() || null;
    const cidade = (campos.cidade ?? "").trim() || null;
    const tipoProjeto = (campos.tipo_projeto ?? campos.tipo ?? "").trim() || null;
    const descrevaProjeto = (campos.descreva_projeto ?? "").trim();
    const mensagemLivre = (campos.mensagem ?? "").trim();
    const mensagem = [mensagemLivre, descrevaProjeto].filter(Boolean).join(" — ") || null;
    const campanha = (campos.campanha ?? "").trim();

    const origemInformada = (campos.origem ?? "site").trim();
    const origem = ORIGENS_VALIDAS.includes(origemInformada) ? origemInformada : "site";

    if (!nome || (!email && !telefone)) {
      return new Response(
        JSON.stringify({ error: "Nome e um contato (e-mail ou telefone) são obrigatórios." }),
        { status: 400 },
      );
    }

    const servicoInteresse = campanha
      ? `${tipoProjeto ?? "Não informado"} (campanha: ${campanha})`
      : tipoProjeto;

    const supabase = createClient(
      import.meta.env.SUPABASE_URL!,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from("leads").insert({
      empresa_id: EMPRESA_ID,
      nome,
      email,
      telefone,
      cidade,
      mensagem,
      servico_interesse: servicoInteresse,
      origem,
    });

    if (error) {
      console.error("Erro ao inserir lead:", error);
      return new Response(JSON.stringify({ error: "Não foi possível registrar o lead." }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (erro) {
    console.error("Erro no endpoint /api/lead:", erro);
    return new Response(JSON.stringify({ error: "Erro inesperado." }), { status: 500 });
  }
};

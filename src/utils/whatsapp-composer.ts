export const ROYAL_WHATSAPP_NUMBER = "5521982590643";

export interface ProjectContext {
  nome: string;
  tipoProjeto: "residencial" | "corporativo";
  escala?: string;
  prazo?: "urgente" | "proximos_meses" | "aberto" | "";
  questao?: string;
}

const projectTypeLabels = {
  residencial: "Residencial",
  corporativo: "Corporativo / Institucional",
} as const;

const timelineLabels = {
  urgente: "Urgente (próximas semanas)",
  proximos_meses: "Próximos meses",
  aberto: "Aberto",
} as const;

export function composeProjectMessage(context: ProjectContext): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de compartilhar contexto sobre um projeto.",
    "",
    `Nome: ${context.nome.trim()}`,
    `Tipo: ${projectTypeLabels[context.tipoProjeto]}`,
  ];

  const escala = context.escala?.trim();
  const questao = context.questao?.trim();
  if (escala) lines.push(`Escala: ${escala}`);
  if (context.prazo) lines.push(`Prazo: ${timelineLabels[context.prazo]}`);
  if (questao) lines.push(`Questão crítica: ${questao}`);

  lines.push("", "Fico à disposição para conversar sobre próximos passos.");
  return lines.join("\n");
}

export function buildProjectWhatsAppUrl(context: ProjectContext): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeProjectMessage(context))}`;
}

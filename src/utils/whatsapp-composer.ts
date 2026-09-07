export const ROYAL_WHATSAPP_NUMBER = "5521982590643";

export interface ProjectContext {
  nome: string;
  tipoProjeto: "residencial" | "corporativo";
  escala?: string;
  prazo?: "urgente" | "proximos_meses" | "aberto" | "";
  questao?: string;
}

export interface PiscinasProjectContext {
  nome: string;
  escala?: string;
  prazo?: ProjectContext["prazo"];
}

export interface FibraProjectContext {
  nome: string;
  necessidade?: string;
  prazo?: ProjectContext["prazo"];
}

export interface ReformaProjectContext {
  nome: string;
  necessidade?: string;
  prazo?: ProjectContext["prazo"];
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

export function composePiscinasProjectMessage(
  context: PiscinasProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre um projeto de piscina.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Piscinas",
  ];

  const escala = context.escala?.trim();
  if (escala) lines.push(`Espaço ou necessidade: ${escala}`);
  if (context.prazo) lines.push(`Prazo: ${timelineLabels[context.prazo]}`);

  lines.push("", "Fico à disposição para conversar sobre os próximos passos.");
  return lines.join("\n");
}

export function buildPiscinasWhatsAppUrl(
  context: PiscinasProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composePiscinasProjectMessage(context))}`;
}

export function composeFibraProjectMessage(
  context: FibraProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre a recuperação de uma piscina de fibra.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Restauração de piscina de fibra",
    "Origem: Página Fibra da Royal Splash",
  ];

  const necessidade = context.necessidade?.trim();
  if (necessidade) lines.push(`Condição ou necessidade: ${necessidade}`);
  if (context.prazo) lines.push(`Prazo: ${timelineLabels[context.prazo]}`);

  lines.push("", "Fico à disposição para conversar sobre a avaliação e os próximos passos.");
  return lines.join("\n");
}

export function buildFibraWhatsAppUrl(
  context: FibraProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeFibraProjectMessage(context))}`;
}

export function composeReformaProjectMessage(
  context: ReformaProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre a reforma de uma piscina.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Reforma de piscina",
    "Origem: Página Reforma da Royal Splash",
  ];

  const necessidade = context.necessidade?.trim();
  if (necessidade) lines.push(`Contexto ou necessidade: ${necessidade}`);
  if (context.prazo) lines.push(`Prazo: ${timelineLabels[context.prazo]}`);

  lines.push("", "Fico à disposição para conversar sobre a avaliação e os próximos passos.");
  return lines.join("\n");
}

export function buildReformaWhatsAppUrl(
  context: ReformaProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeReformaProjectMessage(context))}`;
}

export interface LazerProjectContext {
  nome: string;
  necessidade?: string;
  prazo?: ProjectContext["prazo"];
}

export function composeLazerProjectMessage(
  context: LazerProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre um projeto de área de lazer.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Área de lazer",
    "Origem: Página Lazer da Royal Splash",
  ];

  const necessidade = context.necessidade?.trim();
  if (necessidade) lines.push(`Contexto ou necessidade: ${necessidade}`);
  if (context.prazo) lines.push(`Prazo: ${timelineLabels[context.prazo]}`);

  lines.push("", "Fico à disposição para conversar sobre a avaliação e os próximos passos.");
  return lines.join("\n");
}

export function buildLazerWhatsAppUrl(
  context: LazerProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeLazerProjectMessage(context))}`;
}

export interface SaunaProjectContext {
  nome: string;
  detalhes?: string;
  prazo?: ProjectContext["prazo"];
}

export function composeSaunaProjectMessage(
  context: SaunaProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre um projeto de sauna ou spa.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Sauna e Spa",
    "Origem: Página Sauna da Royal Splash",
  ];

  if (context.detalhes?.trim()) {
    lines.push(`Condição ou necessidade: ${context.detalhes.trim()}`);
  }

  if (context.prazo && timelineLabels[context.prazo]) {
    lines.push(`Prazo: ${timelineLabels[context.prazo]}`);
  }

  return lines.join("\n");
}

export function buildSaunaWhatsAppUrl(
  context: SaunaProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeSaunaProjectMessage(context))}`;
}

export interface VazamentoProjectContext {
  nome: string;
  sintomas?: string;
  prazo?: ProjectContext["prazo"];
}

export function composeVazamentoProjectMessage(
  context: VazamentoProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre um possível vazamento ou problema na minha piscina.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Diagnóstico e Reparo de Vazamento",
    "Origem: Página Vazamento da Royal Splash",
  ];

  if (context.sintomas?.trim()) {
    lines.push(`Contexto ou sintomas: ${context.sintomas.trim()}`);
  }

  if (context.prazo && timelineLabels[context.prazo]) {
    lines.push(`Prazo: ${timelineLabels[context.prazo]}`);
  }

  return lines.join("\n");
}

export function buildVazamentoWhatsAppUrl(
  context: VazamentoProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeVazamentoProjectMessage(context))}`;
}

export interface CorporativoProjectContext {
  nome: string;
  necessidade?: string;
  prazo?: ProjectContext["prazo"];
}

export function composeCorporativoProjectMessage(
  context: CorporativoProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre um projeto corporativo.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Soluções Corporativas",
    "Origem: Página Corporativo da Royal Splash",
  ];

  if (context.necessidade?.trim()) {
    lines.push(`Contexto ou necessidade: ${context.necessidade.trim()}`);
  }

  if (context.prazo && timelineLabels[context.prazo]) {
    lines.push(`Prazo: ${timelineLabels[context.prazo]}`);
  }

  lines.push("", "Fico à disposição para conversar sobre a avaliação e os próximos passos.");
  return lines.join("\n");
}

export function buildCorporativoWhatsAppUrl(
  context: CorporativoProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeCorporativoProjectMessage(context))}`;
}

export interface ReparoSubaquaticoProjectContext {
  nome: string;
  necessidade?: string;
  prazo?: ProjectContext["prazo"];
}

export function composeReparoSubaquaticoProjectMessage(
  context: ReparoSubaquaticoProjectContext,
): string {
  const lines = [
    "Olá Royal,",
    "",
    "Gostaria de conversar sobre um reparo subaquático de piscina.",
    "",
    `Nome: ${context.nome.trim()}`,
    "Interesse: Reparo Subaquático de Piscinas",
    "Origem: Página Reparo Subaquático da Royal Splash",
  ];

  if (context.necessidade?.trim()) {
    lines.push(`Contexto ou necessidade: ${context.necessidade.trim()}`);
  }

  if (context.prazo && timelineLabels[context.prazo]) {
    lines.push(`Prazo: ${timelineLabels[context.prazo]}`);
  }

  lines.push("", "Fico à disposição para conversar sobre a avaliação e os próximos passos.");
  return lines.join("\n");
}

export function buildReparoSubaquaticoWhatsAppUrl(
  context: ReparoSubaquaticoProjectContext,
): string {
  return `https://wa.me/${ROYAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(composeReparoSubaquaticoProjectMessage(context))}`;
}

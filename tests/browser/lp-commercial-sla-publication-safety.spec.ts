import { expect, test } from "@playwright/test";

const cases = [
  {
    route: "/lp/corporativo",
    forbidden: [
      /água limpa, segura e cristalina em até 48 horas/i,
      /Prazos Cumpridos/i,
      /Compromisso com cronograma, sem impacto na operação/i,
    ],
    preserved: [
      /Padrão Internacional/i,
    ],
  },
  {
    route: "/lp/fibra",
    forbidden: [
      /Solicitar orçamento gratuito/i,
      /Avaliação Gratuita/i,
      /Serviço Rápido/i,
      /Entrega no prazo combinado/i,
      /poucos dias de serviço/i,
      /visita de diagnóstico é gratuita e sem compromisso/i,
    ],
    preserved: [
      /Gel Coat/i,
      /Tinta PU/i,
      /Materiais Premium/i,
    ],
  },
  {
    route: "/lp/lazer",
    forbidden: [
      /Prazos Cumpridos/i,
      /prazo é definido em contrato antes do início e cumprido/i,
    ],
    preserved: [
      /Tecnologia de Ponta/i,
      /alto padrão/i,
    ],
  },
  {
    route: "/lp/piscinas",
    forbidden: [
      /prazo e preço fechados em contrato/i,
      /Prazos Cumpridos/i,
      /preço fechado em contrato/i,
      /prazo é definido em contrato antes do início/i,
    ],
    preserved: [
      /Tecnologia de Ponta/i,
      /alto padrão/i,
    ],
  },
  {
    route: "/lp/reforma",
    forbidden: [
      /Solicitar orçamento gratuito/i,
      /Prazo otimizado, sem obra longa/i,
      /Prazos Cumpridos/i,
      /registrado em contrato/i,
    ],
    preserved: [
      /modernização estrutural/i,
      /sem compromisso/i,
      /Tecnologia de Ponta/i,
    ],
  },
  {
    route: "/lp/sauna",
    forbidden: [
      /Prazos Cumpridos/i,
      /Compromisso rigoroso com cronograma e qualidade/i,
    ],
    preserved: [
      /Tecnologia de Ponta/i,
      /alto padrão/i,
    ],
  },
  {
    route: "/lp/vazamento",
    forbidden: [
      /Solicitar orçamento gratuito/i,
      /Visita técnica em até 48 horas/i,
      /Descubra em 2 minutos/i,
      /1 cm por dia/i,
      /Reparo Definitivo/i,
      /Atendimento Rápido/i,
      /Em quanto tempo vocês atendem/i,
      /Casos urgentes/i,
    ],
    preserved: [
      /ponto exato/i,
      /geofone eletrônico/i,
      /teste de pressão/i,
      /piscina cheia/i,
      /sem esvaziar/i,
      /sem escavar às cegas/i,
    ],
  },
];

for (const {
  route,
  forbidden,
  preserved,
} of cases) {
  test(`${route} suppresses standalone commercial and SLA claims`, async ({
    page,
  }) => {
    const response = await page.goto(
      route,
      {
        waitUntil: "networkidle",
      },
    );

    expect(response?.ok()).toBe(true);

    const publicationText = (
      await page.locator("body").textContent()
    ) ?? "";

    const normalized = publicationText
      .replace(/\s+/g, " ")
      .trim();

    for (const pattern of forbidden) {
      expect(normalized).not.toMatch(
        pattern,
      );
    }

    for (const pattern of preserved) {
      expect(normalized).toMatch(
        pattern,
      );
    }
  });
}

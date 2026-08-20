import { expect, test } from "@playwright/test";

const cases = [
  {
    route: "/lp/corporativo",
    forbidden: [
      /precisão técnica/i,
      /Segurança Normativa/i,
      /padrões técnicos exigidos/i,
      /acessibilidade e acabamentos preparados para uso intenso/i,
    ],
    preserved: [
      /Piscinas Olímpicas e Complexos Aquáticos/i,
      /Projetamos e executamos piscinas semiolímpicas, olímpicas e recreativas/i,
      /Padrão Internacional/i,
    ],
  },
  {
    route: "/lp/piscinas",
    forbidden: [
      /engenharia responsável/i,
      /projeto 3D à entrega/i,
      /visualização 3D antes de fechar/i,
      /avaliação estrutural com engenheiro responsável/i,
      /Posso construir piscina em cobertura ou laje/i,
      /Equipe Qualificada/i,
      /Profissionais treinados em alto padrão/i,
    ],
    preserved: [
      /Alvenaria sob medida/i,
      /Fazemos o projeto completo/i,
      /Tecnologia de Ponta/i,
      /alto padrão/i,
    ],
  },
  {
    route: "/lp/sauna",
    forbidden: [
      /sistemas de aquecimento eficientes e seguros/i,
      /Equipe Qualificada/i,
      /Profissionais treinados em alto padrão/i,
    ],
    preserved: [
      /Projetos personalizados com sistemas de aquecimento/i,
      /Tecnologia de Ponta/i,
    ],
  },  {
    route: "/lp/fibra",
    forbidden: [
      /Especialistas em Restauração de Fibra/i,
      /Especialistas em Fibra/i,
      /Profissionais treinados especificamente em fibra de vidro/i,
    ],
    preserved: [
      /Restauração de Fibra/i,
      /Gel Coat/i,
      /Tinta PU/i,
      /Materiais Premium/i,
    ],
  },
  {
    route: "/lp/lazer",
    forbidden: [
      /Equipe Qualificada/i,
      /Profissionais treinados em alto padrão/i,
    ],
    preserved: [
      /Atendimento Premium/i,
      /Tecnologia de Ponta/i,
    ],
  },
  {
    route: "/lp/reforma",
    forbidden: [
      /Equipe Qualificada/i,
      /Profissionais treinados em alto padrão/i,
    ],
    preserved: [
      /Atendimento Premium/i,
      /Tecnologia de Ponta/i,
      /modernização estrutural/i,
    ],
  },
  {
    route: "/lp/vazamento",
    forbidden: [
      /Especialistas em Detecção de Vazamentos/i,
      /Equipe Qualificada/i,
      /Profissionais treinados em detecção técnica/i,
    ],
    preserved: [
      /Detecção de Vazamentos/i,
      /Tecnologia de Ponta/i,
      /Equipamentos de detecção acústica e pressão/i,
      /ponto exato/i,
    ],
  },

];

for (const {
  route,
  forbidden,
  preserved,
} of cases) {
  test(`${route} suppresses unsupported pure technical authority claims`, async ({
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
      expect(normalized).not.toMatch(pattern);
    }

    for (const pattern of preserved) {
      expect(normalized).toMatch(pattern);
    }
  });
}

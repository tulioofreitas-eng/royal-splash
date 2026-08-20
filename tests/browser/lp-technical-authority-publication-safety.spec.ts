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
      /Gel Coat/i,
      /Tinta PU/i,
      /resinas de alta performance/i,
      /alta resistência a produtos químicos e raios UV/i,
      /alta aderência e flexibilidade/i,
      /Devolvemos a beleza e a proteção/i,
      /Cada caso é avaliado individualmente/i,
      /100% eliminada/i,
      /Diagnóstico honesto/i,
      /diagnóstico presencial define a indicação/i,
      /A maioria sim/i,
      /limite de recuperação/i,
      /avaliação transparente do que é possível resolver/i,
    ],
    preserved: [
      /Reparo de Trincas/i,
      /desgaste estrutural/i,
      /Restauração de Fibra/i,
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
      /sem precisar reconstruir do zero/i,
      /estrutura é aproveitada/i,
      /sem reconstruir/i,
      /aproveitamos a obra aberta/i,
      /Automação por aplicativo/i,
      /filtragem, iluminação e aquecimento no celular/i,
      /projeto personalizado/i,
      /use a piscina o ano inteiro/i,
      /Tratamento com sal/i,
      /água mais suave e menos manutenção química/i,
      /Conversão para borda infinita/i,
      /avaliação de viabilidade/i,
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

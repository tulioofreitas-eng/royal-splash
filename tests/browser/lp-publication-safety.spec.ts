import { expect, test } from "@playwright/test";

const landingRoutes = [
  "/lp/corporativo",
  "/lp/fibra",
  "/lp/lazer",
  "/lp/piscinas",
  "/lp/reforma",
  "/lp/sauna",
  "/lp/vazamento",
];

const quarantinedNames = [
  "Carlos Eduardo Mendes",
  "Fernanda Azevedo",
  "Rodrigo Salles",
  "Beatriz Nogueira",
  "André Luiz Ferreira",
  "Camila Duarte",
  "Marcelo Tavares",
  "Juliana Ramos",
  "Paulo Henrique Costa",
  "Fábio Werneck",
  "Luciana Prado Amorim",
  "Ricardo Bittencourt",
  "Renata Assunção Lima",
  "Thiago Ribas Coutinho",
  "Marina Costa Prado",
  "Roberto Lima",
  "Patrícia Gonçalves",
  "Eduardo Martins",
  "Carlos Eduardo",
  "Mariana Albuquerque",
  "Roberto Silveira",
];

for (const route of landingRoutes) {
  test(`${route} suppresses unverified proof, warranty and Foundation-conflict claims`, async ({
    page,
  }) => {
    const reviewRequests: string[] = [];

    page.on("request", (request) => {
      const url = new URL(request.url());

      if (url.pathname === "/api/reviews") {
        reviewRequests.push(request.url());
      }
    });

    const response = await page.goto(route, {
      waitUntil: "networkidle",
    });

    expect(response?.ok()).toBe(true);

    const body = page.locator("body");

    await expect(body).not.toContainText(
      /O que dizem nossos clientes/i,
    );

    await expect(body).not.toContainText(
      /O que dizem no Google/i,
    );

    await expect(body).not.toContainText(
      /garantia/i,
    );

    await expect(body).not.toContainText(
      /sem terceirização/i,
    );

    for (const name of quarantinedNames) {
      await expect(body).not.toContainText(name);
    }

    expect(reviewRequests).toEqual([]);
  });
}

test("/lp/reparo-subaquatico is held out of the current release candidate", async ({
  page,
}) => {
  const response = await page.goto(
    "/lp/reparo-subaquatico",
    {
      waitUntil: "domcontentloaded",
    },
  );

  expect(response).not.toBeNull();
  expect(response?.status()).toBe(404);

  expect(
    new URL(page.url()).pathname,
  ).toBe(
    "/lp/reparo-subaquatico",
  );

  const bodyText = await page
    .locator("body")
    .innerText();

  expect(bodyText).not.toMatch(
    /sem esvaziar|piscina cheia|sem interromper|sem parar|substituição submersa|Técnica Especializada|Equipe treinada especificamente nesse método/i,
  );
});

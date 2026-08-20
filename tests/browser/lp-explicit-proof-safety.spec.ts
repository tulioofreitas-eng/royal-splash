import { expect, test } from "@playwright/test";

const checks = [
  {
    route: "/lp/fibra",
    bodyForbidden: [
      /Antes e depois da restauração/i,
    ],
    altForbidden: [
      /Piscina de fibra antes da restauração Royal Splash/i,
      /Aplicação de gel coat Royal Splash/i,
      /superfície restaurada Royal Splash/i,
      /Piscina de fibra restaurada Royal Splash/i,
    ],
  },
  {
    route: "/lp/lazer",
    bodyForbidden: [
      /Projetos que falam por si/i,
    ],
    altForbidden: [
      /Obra Royal Splash/i,
    ],
  },
  {
    route: "/lp/reforma",
    bodyForbidden: [
      /Projetos que falam por si/i,
      /De piscina antiga a área premium/i,
    ],
    altForbidden: [
      /Piscina antes da reforma Royal Splash/i,
      /Remoção de revestimento antigo Royal Splash/i,
      /Aplicação de novo revestimento Royal Splash/i,
      /Piscina reformada Royal Splash/i,
      /Obra Royal Splash/i,
    ],
  },
  {
    route: "/lp/sauna",
    bodyForbidden: [
      /Projetos que falam por si/i,
    ],
    altForbidden: [
      /Obra Royal Splash/i,
    ],
  },
  {
    route: "/lp/vazamento",
    bodyForbidden: [
      /Nosso serviço em ação/i,
    ],
    altForbidden: [
      /Reparo de vazamento executado Royal Splash/i,
      /Equipamento de detecção de vazamento em ação Royal Splash/i,
    ],
  },
];

for (const check of checks) {
  test(`${check.route} suppresses explicit unverified proof surfaces`, async ({
    page,
  }) => {
    const response = await page.goto(
      check.route,
      {
        waitUntil: "networkidle",
      },
    );

    expect(response?.ok()).toBe(true);

    const bodyText =
      (await page.locator("body").innerText())
        .replace(/\s+/g, " ")
        .trim();

    for (const pattern of check.bodyForbidden) {
      expect(bodyText).not.toMatch(pattern);
    }

    const altText = (
      await page
        .locator("img")
        .evaluateAll(
          (images) =>
            images
              .map(
                (image) =>
                  image.getAttribute("alt") ?? "",
              )
              .join(" | "),
        )
    )
      .replace(/\s+/g, " ")
      .trim();

    for (const pattern of check.altForbidden) {
      expect(altText).not.toMatch(pattern);
    }
  });
}

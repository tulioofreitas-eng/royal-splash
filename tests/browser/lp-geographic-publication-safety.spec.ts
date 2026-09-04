import { expect, test } from "@playwright/test";

const routes = [
  "/lp/corporativo",
  "/lp/fibra",
  "/lp/lazer",
  "/lp/piscinas",
  "/lp/reforma",
  "/lp/sauna",
  "/lp/vazamento",
];

const geographicServiceScope =
  /Rio\s+de\s+Janeiro|todo\s+o\s+Rio|todo\s+o\s+estado\s+do\s+Rio|Atendimento\s+em\s+todo|Atendemos\s+em\s+todo|Barra,\s*Zona\s+Sul|Zona\s+Sul,\s*Barra|Recreio,\s*Niterói/i;

for (const route of routes) {
  test(`${route} suppresses unverified geographic service scope`, async ({
    page,
  }) => {
    const response = await page.goto(route);

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);

    await expect(page).not.toHaveTitle(
      geographicServiceScope,
    );

    const description = page.locator(
      'meta[name="description"]',
    );

    await expect(description).toHaveCount(1);
    await expect(description).not.toHaveAttribute(
      "content",
      geographicServiceScope,
    );

    const body = page.locator("body");

    await expect(body).not.toContainText(
      geographicServiceScope,
    );

    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    for (const raw of structuredData) {
      const parsed = JSON.parse(raw);

      expect(parsed).not.toHaveProperty(
        "areaServed",
      );

      if (
        typeof parsed.description === "string"
      ) {
        expect(parsed.description).not.toMatch(
          geographicServiceScope,
        );
      }
    }
  });
}

test("/lp/vazamento does not attribute editorial media to an unverified geography", async ({
  page,
}) => {
  const response = await page.goto(
    "/lp/vazamento",
  );

  expect(response).not.toBeNull();
  expect(response?.ok()).toBe(true);

  const heroImage = page.locator(
    'img[alt^="Detecção de vazamento em piscina"]',
  );

  await expect(heroImage).toHaveCount(1);

  await expect(heroImage).toHaveAttribute(
    "alt",
    "Detecção de vazamento em piscina",
  );
});

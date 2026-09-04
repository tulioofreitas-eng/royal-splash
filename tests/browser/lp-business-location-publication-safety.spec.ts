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

for (const route of routes) {
  test(`${route} does not publish unsupported LocalBusiness location data`, async ({
    page,
  }) => {
    const response = await page.goto(route);

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);

    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    for (const raw of structuredData) {
      const parsed = JSON.parse(raw);

      expect(parsed["@type"]).not.toBe(
        "LocalBusiness",
      );

      expect(parsed).not.toHaveProperty(
        "address",
      );

      expect(parsed).not.toHaveProperty(
        "addressRegion",
      );

      expect(parsed).not.toHaveProperty(
        "addressCountry",
      );
    }
  });
}

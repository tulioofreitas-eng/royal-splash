import { expect, test } from "@playwright/test";

const routes = [
  "/lp/corporativo",
  "/lp/fibra",
  "/lp/lazer",
  "/lp/reforma",
  "/lp/sauna",
];

for (const route of routes) {
  test(`${route} editorial media does not claim Royal execution attribution`, async ({
    page,
  }) => {
    const response = await page.goto(
      route,
      {
        waitUntil: "networkidle",
      },
    );

    expect(response?.ok()).toBe(true);

    const alts = await page
      .locator("img")
      .evaluateAll(
        (images) =>
          images.map(
            (image) =>
              image.getAttribute("alt") ?? "",
          ),
      );

    for (const alt of alts) {
      expect(alt).not.toMatch(
        /Royal Splash/i,
      );
    }
  });
}

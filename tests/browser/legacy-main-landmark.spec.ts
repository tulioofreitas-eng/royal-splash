import {
  expect,
  test,
} from "@playwright/test";

import AxeBuilder
  from "@axe-core/playwright";

const routes = [
  "/contato",
  "/lp/corporativo",
  "/lp/fibra",
  "/lp/lazer",
  "/lp/piscinas",
  "/lp/reforma",
  "/lp/sauna",
  "/lp/vazamento",
  "/obrigado",
];

for (
  const route
  of routes
) {
  test(
    `${route} owns one stable main landmark`,
    async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      const response =
        await page.goto(route);

      expect(response).not.toBeNull();
      expect(response?.ok()).toBe(true);

      const main =
        page.locator(
          "main#main-content"
        );

      await expect(main).toHaveCount(1);

      await expect(
        main
      ).toHaveAttribute(
        "tabindex",
        "-1",
      );

      await expect(
        main.locator("h1")
      ).toHaveCount(1);

      await expect(
        main.locator(
          "header, footer"
        )
      ).toHaveCount(0);

      const accessibility =
        await new AxeBuilder({
          page,
        })
          .withRules([
            "landmark-one-main",
            "region",
          ])
          .analyze();

      expect(
        accessibility.violations,
      ).toEqual([]);
    },
  );
}

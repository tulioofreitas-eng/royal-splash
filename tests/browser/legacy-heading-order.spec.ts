import {
  expect,
  test,
} from "@playwright/test";

import AxeBuilder
  from "@axe-core/playwright";

const routes = [
  {
    route: "/lp/corporativo",
    headings: [
      "Atendimento Dedicado",
      "Padrão Internacional",
    ],
  },
  {
    route: "/lp/lazer",
    headings: [
      "Atendimento Premium",
      "Tecnologia de Ponta",
    ],
  },
  {
    route: "/lp/piscinas",
    headings: [
      "Atendimento Premium",
      "Tecnologia de Ponta",
    ],
  },
  {
    route: "/lp/reforma",
    headings: [
      "Atendimento Premium",
      "Tecnologia de Ponta",
    ],
  },
  {
    route: "/lp/sauna",
    headings: [
      "Atendimento Premium",
      "Tecnologia de Ponta",
    ],
  },
  {
    route: "/lp/vazamento",
    headings: [
      "Tecnologia de Ponta",
      "Atendimento Premium",
    ],
  },
];

for (
  const target
  of routes
) {
  test(
    `${target.route} preserves trust-card content with valid heading order`,
    async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      const response =
        await page.goto(
          target.route,
        );

      expect(response).not.toBeNull();
      expect(response?.ok()).toBe(true);

      for (
        const heading
        of target.headings
      ) {
        const semanticHeading =
          page.getByRole(
            "heading",
            {
              name: heading,
              level: 3,
              exact: true,
            },
          );

        await expect(
          semanticHeading,
        ).toHaveCount(1);

        await expect(
          semanticHeading,
        ).toHaveClass(
          /font-semibold/,
        );

        await expect(
          semanticHeading,
        ).toHaveClass(
          /mb-1/,
        );
      }

      await expect(
        page.locator(
          'main h4',
        ),
      ).toHaveCount(0);

      const accessibility =
        await new AxeBuilder({
          page,
        })
          .withRules([
            "heading-order",
          ])
          .analyze();

      expect(
        accessibility.violations,
      ).toEqual([]);
    },
  );
}

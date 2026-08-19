import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const segments = [
  {
    homeLink: "Explorar Residencial",
    route: "/servicos",
    context: "residencial",
    heading: "Residencial",
    cta: "Inicie seu projeto residencial",
  },
  {
    homeLink:
      "Explorar Corporativo / Institucional",
    route: "/corporativo",
    context: "corporativo_institucional",
    heading: "Corporativo / Institucional",
    cta:
      "Inicie seu projeto corporativo / institucional",
  },
] as const;

for (const segment of segments) {
  test(`${segment.heading} preserves context into qualified intake`, async ({
    page,
  }) => {
    await page.goto("/");

    const router = page.getByRole("region", {
      name: "Escolha seu contexto",
    });

    await router.getByRole("link", {
      name: segment.homeLink,
      exact: true,
    }).click();

    await expect(page).toHaveURL(
      new RegExp(`${segment.route}$`),
    );

    const main = page.getByRole("main");

    await expect(
      main.getByRole("heading", {
        level: 1,
        name: segment.heading,
        exact: true,
      }),
    ).toBeVisible();

    const qualifiedActions =
      main.getByRole("link", {
        name: segment.cta,
        exact: true,
      });

    await expect(
      qualifiedActions,
    ).toHaveCount(2);

    const expectedHref =
      `/inicie-seu-projeto?context=${segment.context}`;

    for (let index = 0; index < 2; index += 1) {
      await expect(
        qualifiedActions.nth(index),
      ).toHaveAttribute(
        "href",
        expectedHref,
      );
    }

    await qualifiedActions.first().click();

    await expect(page).toHaveURL(
      new RegExp(
        `/inicie-seu-projeto\\?context=${segment.context}$`,
      ),
    );

    await expect(
      page.getByLabel("Contexto", {
        exact: true,
      }),
    ).toHaveValue(segment.context);
  });

  test(`${segment.heading} functional context surface has no automated axe violations`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto(segment.route);

    const accessibilityScanResults =
      await new AxeBuilder({
        page,
      }).analyze();

    expect(
      accessibilityScanResults.violations,
    ).toEqual([]);
  });
}

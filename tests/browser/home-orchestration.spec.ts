import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Home functional orchestration", () => {
  test("implements the approved context-to-qualified-action journey", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      "pt-BR",
    );

    const main = page.getByRole("main");

    await expect(
      main.getByRole("heading", {
        level: 1,
        name: "Encontre o contexto certo para avançar.",
      }),
    ).toBeVisible();

    const segmentRouter = main.getByRole("region", {
      name: "Escolha seu contexto",
    });

    await expect(
      segmentRouter.getByRole("link", {
        name: "Explorar Residencial",
      }),
    ).toHaveAttribute("href", "/servicos");

    await expect(
      segmentRouter.getByRole("link", {
        name: "Explorar Corporativo / Institucional",
      }),
    ).toHaveAttribute("href", "/corporativo");

    await expect(
      main.getByRole("link", {
        name: "Explorar Projetos",
      }),
    ).toHaveAttribute("href", "/projetos");

    await expect(
      main.getByRole("link", {
        name: "Conhecer Método Royal",
      }),
    ).toHaveAttribute("href", "/metodo-royal");

    await expect(
      main.getByRole("link", {
        name: "Conhecer A Royal",
      }),
    ).toHaveAttribute("href", "/sobre");

    const qualifiedActions = main.getByRole("link", {
      name: "Inicie seu projeto",
      exact: true,
    });

    await expect(qualifiedActions).toHaveCount(2);

    for (let index = 0; index < 2; index += 1) {
      await expect(
        qualifiedActions.nth(index),
      ).toHaveAttribute(
        "href",
        "/inicie-seu-projeto",
      );
    }

    await expect(
      main.getByRole("link", {
        name: "Contato e canais auxiliares",
      }),
    ).toHaveAttribute("href", "/contato");
  });

  test("new Home architecture has no automated axe violations", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto("/");

    const accessibilityScanResults =
      await new AxeBuilder({
        page,
      }).analyze();

    expect(
      accessibilityScanResults.violations,
    ).toEqual([]);
  });
});

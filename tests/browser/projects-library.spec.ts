import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
} from "@playwright/test";

test.describe(
  "publication-safe Projects library",
  () => {
    test("renders controlled empty state instead of invented cases", async ({
      page,
    }) => {
      await page.goto(
        "/projetos",
      );

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Projetos",
        }),
      ).toBeVisible();

      const library =
        page.getByRole("region", {
          name:
            "Projetos disponíveis",
        });

      await expect(
        library,
      ).toHaveAttribute(
        "data-projects-count",
        "0",
      );

      await expect(
        library.locator(
          '[data-projects-state="empty"]',
        ),
      ).toBeVisible();

      await expect(
        page.getByRole("heading", {
          level: 3,
          name:
            "Nenhum projeto verificado disponível nesta superfície",
        }),
      ).toBeVisible();

      await expect(
        page.locator(
          'a[href^="/projetos/"]',
        ),
      ).toHaveCount(0);
    });

    test("connects proof surface to trust method and qualified action", async ({
      page,
    }) => {
      await page.goto(
        "/projetos",
      );

      await expect(
        page.getByRole("link", {
          name:
            "Conhecer Método Royal",
        }),
      ).toHaveAttribute(
        "href",
        "/metodo-royal",
      );

      await expect(
        page.getByRole("link", {
          name:
            "Conhecer A Royal",
        }),
      ).toHaveAttribute(
        "href",
        "/sobre",
      );

      const qualifiedAction =
        page.getByRole("region", {
          name:
            "Avance com o contexto do seu projeto",
        }).getByRole("link", {
          name:
            "Inicie seu projeto",
          exact: true,
        });

      await expect(
        qualifiedAction,
      ).toHaveAttribute(
        "href",
        "/inicie-seu-projeto",
      );

      await expect(
        qualifiedAction,
      ).toHaveAttribute(
        "data-analytics-component",
        "royal_projects",
      );

      await expect(
        qualifiedAction,
      ).toHaveAttribute(
        "data-analytics-channel",
        "site_form",
      );
    });

    test("has responsive integrity and zero automated axe violations", async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      await page.goto(
        "/projetos",
      );

      const noOverflow =
        await page.evaluate(() => {
          const root =
            document.documentElement;

          return (
            root.scrollWidth <=
            root.clientWidth
          );
        });

      expect(
        noOverflow,
      ).toBe(true);

      const scan =
        await new AxeBuilder({
          page,
        }).analyze();

      expect(
        scan.violations,
      ).toEqual([]);
    });
  },
);

import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
} from "@playwright/test";

test.describe(
  "A Royal functional trust surface",
  () => {
    test("uses controlled trust architecture without carrying legacy institutional claims", async ({
      page,
    }) => {
      await page.goto("/sobre");

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "A Royal",
        }),
      ).toBeVisible();

      await expect(
        page.locator(
          '[data-trust-stage="institutional-context"]',
        ),
      ).toBeVisible();

      await expect(
        page.locator(
          '[data-trust-stage="references"]',
        ),
      ).toBeVisible();

      await expect(
        page.getByRole("link", {
          name: "Explorar Projetos",
        }),
      ).toHaveAttribute(
        "href",
        "/projetos",
      );

      await expect(
        page.getByRole("link", {
          name: "Conhecer Método Royal",
        }).last(),
      ).toHaveAttribute(
        "href",
        "/metodo-royal",
      );

      const qualifiedAction =
        page.getByRole("region", {
          name: "Próximo passo",
        }).getByRole("link", {
          name: "Inicie seu projeto",
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
        "royal_trust",
      );

      await expect(
        qualifiedAction,
      ).toHaveAttribute(
        "data-analytics-channel",
        "site_form",
      );

      await expect(
        page.getByRole("link", {
          name:
            "Contato e canais auxiliares",
        }),
      ).toHaveAttribute(
        "href",
        "/contato",
      );

      const html =
        await page.locator("body")
          .innerText();

      expect(html).not.toContain(
        "20+",
      );

      expect(html).not.toContain(
        "500+",
      );

      expect(html).not.toContain(
        "100%",
      );

      expect(html).not.toContain(
        "Rio de Janeiro",
      );

      expect(html).not.toContain(
        "Santa Catarina",
      );

      expect(html).not.toContain(
        "equipe própria",
      );
    });

    test("remains responsive and has no automated axe violations on mobile", async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      await page.goto("/sobre");

      const noOverflow =
        await page.evaluate(() => {
          const root =
            document.documentElement;

          return (
            root.scrollWidth <=
            root.clientWidth
          );
        });

      expect(noOverflow).toBe(true);

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

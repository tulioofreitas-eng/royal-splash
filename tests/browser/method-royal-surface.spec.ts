import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
} from "@playwright/test";

test.describe(
  "Método Royal functional surface",
  () => {
    test("connects context, controlled method, proof, trust and qualified action", async ({
      page,
    }) => {
      await page.goto(
        "/metodo-royal",
      );

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Método Royal",
        }),
      ).toBeVisible();

      for (
        const stage
        of [
          "context",
          "controlled-method",
          "proof",
          "qualified-action",
        ]
      ) {
        await expect(
          page.locator(
            `[data-method-stage="${stage}"]`,
          ),
        ).toBeVisible();
      }

      await expect(
        page.getByRole("link", {
          name: "Explorar Residencial",
        }),
      ).toHaveAttribute(
        "href",
        "/servicos",
      );

      await expect(
        page.getByRole("link", {
          name:
            "Explorar Corporativo / Institucional",
        }),
      ).toHaveAttribute(
        "href",
        "/corporativo",
      );

      await expect(
        page.getByRole("link", {
          name: "Conhecer A Royal",
        }),
      ).toHaveAttribute(
        "href",
        "/sobre",
      );

      await expect(
        page.getByRole("link", {
          name: "Explorar Projetos",
        }),
      ).toHaveAttribute(
        "href",
        "/projetos",
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
        "royal_method",
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
    });

    test("does not invent detailed operational method claims", async ({
      page,
    }) => {
      await page.goto(
        "/metodo-royal",
      );

      const bodyText =
        await page.locator(
          "body",
        ).innerText();

      const unsupportedFixtures = [
        "30 dias",
        "prazo garantido",
        "equipe própria",
        "100%",
        "visita técnica gratuita",
        "garantia vitalícia",
      ];

      for (
        const fixture
        of unsupportedFixtures
      ) {
        expect(
          bodyText,
        ).not.toContain(
          fixture,
        );
      }

      await expect(
        page.getByRole("heading", {
          level: 2,
          name:
            "Método detalhado",
        }),
      ).toBeVisible();
    });

    test("has responsive integrity and zero automated axe violations", async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      await page.goto(
        "/metodo-royal",
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

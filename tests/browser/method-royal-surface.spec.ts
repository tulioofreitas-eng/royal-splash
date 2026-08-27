import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const SIGNATURE_PATH =
  "/brand/identity/signatures/royal-splash-signature-h1-gold.svg";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
}

test.describe(
  "Método Royal Brand consumer",
  () => {
    test("connects context, controlled method, proof, trust and qualified action", async ({
      page,
    }) => {
      await page.goto(
        "/metodo-royal",
      );

      await expect(page.locator("body")).toHaveAttribute(
        "data-site-visual",
        "brand",
      );
      await expect(page.locator("[data-site-header]")).toHaveAttribute(
        "data-site-header-visual",
        "brand",
      );
      await expect(page.locator(`img[src="${SIGNATURE_PATH}"]`)).toBeVisible();

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
        qualifiedAction,
      ).toHaveAttribute(
        "data-analytics-subject",
        "project_start",
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

    test("consumes canonical Brand typography, colors, fonts and qualified-action surface", async ({
      page,
    }) => {
      const brandFontRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("/brand/fonts/")) {
          brandFontRequests.push(request.url());
        }
      });

      await page.goto("/metodo-royal");

      await expect(page.getByRole("heading", {
        level: 1,
        name: "Método Royal",
      })).toHaveCSS("font-family", /Cormorant Garamond/);
      await expect(page.locator('[data-method-stage="entry"] > p').last()).toHaveCSS(
        "font-family",
        /Hanken Grotesk/,
      );
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        "rgb(250, 249, 246)",
      );
      await expect(page.locator("body")).toHaveCSS("color", "rgb(18, 23, 28)");

      const conversion = page.locator('[data-method-stage="qualified-action"]');
      await expect(conversion).toHaveClass(/site-primitive-surface--dark/);
      await expect(conversion).toHaveCSS("background-color", "rgb(18, 23, 28)");
      await expect(conversion).toHaveCSS("color", "rgb(255, 255, 255)");
      expect(brandFontRequests.some((url) => url.includes("hanken-grotesk"))).toBe(true);
      expect(brandFontRequests.some((url) => url.includes("cormorant-garamond"))).toBe(true);
    });

    test("preserves heading hierarchy and visible keyboard focus", async ({ page }) => {
      await page.goto("/metodo-royal");

      expect(await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((headings) =>
        headings.map((heading) => Number(heading.tagName.slice(1)))
      )).toEqual([1, 2, 2, 2, 2]);

      await page.keyboard.press("Tab");
      const focused = page.locator(":focus-visible");
      await expect(focused).toBeVisible();
      expect(await focused.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
      })).toBe(true);
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
            "Caminhos para seu projeto",
        }),
      ).toBeVisible();
    });

    test("has responsive integrity at mobile, tablet and desktop with zero automated axe violations", async ({
      page,
    }) => {
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto("/metodo-royal");
        await expect(page.getByRole("heading", {
          level: 1,
          name: "Método Royal",
        })).toBeVisible();
        await expectNoHorizontalOverflow(page);
      }

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

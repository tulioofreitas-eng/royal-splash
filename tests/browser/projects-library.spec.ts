import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const SIGNATURE_PATH =
  "/brand/identity/signatures/royal-splash-signature-h1-gold.svg";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const noOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth;
  });

  expect(noOverflow).toBe(true);
}

async function expectNoAxeViolations(page: Page): Promise<void> {
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations).toEqual([]);
}

async function removeDevelopmentToolbar(page: Page): Promise<void> {
  await page.locator("astro-dev-toolbar").evaluateAll((toolbars) => {
    for (const toolbar of toolbars) {
      toolbar.remove();
    }
  });
}

test.describe(
  "publication-safe Brand Projects library",
  () => {
    test("renders the approved Brand consumer and controlled zero-Case state", async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 1440,
        height: 1000,
      });

      await page.goto(
        "/projetos",
      );

      await expect(page.locator("body")).toHaveAttribute(
        "data-template-family",
        "site",
      );
      await expect(page.locator("body")).toHaveAttribute(
        "data-site-visual",
        "brand",
      );
      await expect(page.locator("[data-site-header]")).toHaveAttribute(
        "data-site-header-visual",
        "brand",
      );

      const signature = page.locator(
        `img[src="${SIGNATURE_PATH}"]`,
      );
      await expect(signature).toBeVisible();

      const heading = page.getByRole("heading", {
        level: 1,
        name: "Projetos",
      });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveCSS(
        "font-family",
        /Cormorant Garamond/,
      );

      await expect(
        page.locator('[data-projects-stage="entry"] > .site-primitive-body'),
      ).toHaveCSS(
        "font-family",
        /Hanken Grotesk/,
      );

      await expect(page.locator("[data-site-header]")).toHaveCSS(
        "background-color",
        "rgb(18, 23, 28)",
      );

      const primaryNavigation = page.getByRole("navigation", {
        name: "Navegação principal",
      });
      await expect(
        primaryNavigation.getByRole("link", {
          name: "Projetos",
          exact: true,
        }),
      ).toHaveAttribute(
        "aria-current",
        "page",
      );

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

      await expectNoHorizontalOverflow(page);
      await expectNoAxeViolations(page);
      await removeDevelopmentToolbar(page);
      await page.screenshot({
        path: "/tmp/royal-p2d-wp1-projects-desktop.png",
        fullPage: true,
      });
    });

    test("preserves trust routes, structured project CTA, auxiliary route, and analytics", async ({
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
        "data-analytics-subject",
        "project_start",
      );
      await expect(
        qualifiedAction,
      ).toHaveAttribute(
        "data-analytics-channel",
        "site_form",
      );

      await expect(
        page.getByRole("link", {
          name: "Contato e canais auxiliares",
        }),
      ).toHaveAttribute(
        "href",
        "/contato",
      );
    });

    test("mobile preserves keyboard focus, responsive integrity, zero Case links, and accessibility", async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      await page.goto(
        "/projetos",
      );

      const trigger = page.locator("[data-site-nav-trigger]");
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await expect(trigger).toBeFocused();
      await trigger.press("Enter");

      const mobileNavigation = page.getByRole("navigation", {
        name: "Navegação móvel",
      });
      await expect(mobileNavigation).toBeVisible();

      const firstLink = mobileNavigation.getByRole("link", {
        name: "Projetos",
        exact: true,
      });
      await expect(firstLink).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(mobileNavigation).toBeHidden();
      await expect(trigger).toBeFocused();

      const library = page.getByRole("region", {
        name: "Projetos disponíveis",
      });
      await expect(library).toHaveAttribute(
        "data-projects-count",
        "0",
      );
      await expect(
        page.locator('a[href^="/projetos/"]'),
      ).toHaveCount(0);

      await expectNoHorizontalOverflow(page);
      await expectNoAxeViolations(page);
      await removeDevelopmentToolbar(page);
      await page.screenshot({
        path: "/tmp/royal-p2d-wp1-projects-mobile.png",
        fullPage: true,
      });
    });
  },
);

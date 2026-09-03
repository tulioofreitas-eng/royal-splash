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
    test("renders the approved Brand consumer and the governed final-result gallery", async ({
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

      const signature = page.locator("[data-site-header]").locator(
        `img[src="${SIGNATURE_PATH}"]`,
      );
      await expect(signature).toBeVisible();

      const heading = page.getByRole("heading", {
        level: 1,
        name: "Fotografias de projetos realizados.",
      });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveCSS(
        "font-family",
        /Cormorant Garamond/,
      );

      await expect(
        page.locator('.experience-entry .experience-lead'),
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

      const gallery =
        page.locator(
          "[data-project-gallery]",
        );

      await expect(
        gallery,
      ).toHaveAttribute(
        "data-projects-count",
        "14",
      );

      await expect(
        gallery.locator("figure.project-gallery__item"),
      ).toHaveCount(14);

      await expect(
        page.getByRole("heading", {
          level: 3,
          name:
            "Nenhum projeto disponível no momento",
        }),
      ).toHaveCount(0);

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

    test("preserves trust routes, direct WhatsApp conversion, and analytics", async ({
      page,
    }) => {
      await page.goto(
        "/projetos",
      );

      const conversion = page.getByRole("region", {
        name:
          "Seu projeto pode começar com uma conversa.",
      });

      await expect(
        conversion.getByRole("link", {
          name:
            "Conhecer Método Royal",
        }),
      ).toHaveAttribute(
        "href",
        "/metodo-royal",
      );

      const primaryAction =
        conversion.getByRole("link", {
          name:
            "WhatsApp sobre um projeto",
        });

      await expect(
        primaryAction,
      ).toHaveAttribute(
        "href",
        "https://wa.me/5521982590643",
      );

      await expect(
        primaryAction,
      ).toHaveAttribute(
        "data-analytics-component",
        "projects_whatsapp",
      );
      await expect(
        primaryAction,
      ).toHaveAttribute(
        "data-analytics-subject",
        "project_start",
      );
      await expect(
        primaryAction,
      ).toHaveAttribute(
        "data-analytics-channel",
        "whatsapp",
      );
    });

    test("mobile preserves keyboard focus, responsive integrity, no legacy Case links, and accessibility", async ({
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

      const gallery = page.locator("[data-project-gallery]");
      await expect(gallery).toHaveAttribute(
        "data-projects-count",
        "14",
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

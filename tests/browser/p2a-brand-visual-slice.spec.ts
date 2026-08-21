import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

async function expectProportionalSignature(page: Page): Promise<void> {
  const signature = page.locator(`img[src="${SIGNATURE_PATH}"]`);

  await expect(signature).toBeVisible();

  const geometry = await signature.evaluate((image: HTMLImageElement) => {
    const bounds = image.getBoundingClientRect();
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: bounds.width,
      renderedHeight: bounds.height,
    };
  });

  expect(geometry.naturalWidth).toBeGreaterThan(0);
  expect(geometry.naturalHeight).toBeGreaterThan(0);
  expect(geometry.renderedWidth).toBeGreaterThan(0);
  expect(geometry.renderedHeight).toBeGreaterThan(0);

  const naturalRatio = geometry.naturalWidth / geometry.naturalHeight;
  const renderedRatio = geometry.renderedWidth / geometry.renderedHeight;
  expect(Math.abs(renderedRatio - naturalRatio) / naturalRatio).toBeLessThan(
    0.02,
  );
}

test.describe("P2A Brand visual slice", () => {
  test("desktop realizes the approved About Brand surface", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/sobre");

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

    await expectProportionalSignature(page);

    const heading = page.getByRole("heading", { level: 1, name: "A Royal" });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS("font-family", /Cormorant Garamond/);

    await expect(page.locator('[data-trust-stage="entry"] > p').last())
      .toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(page.locator("[data-site-header]")).toHaveCSS(
      "background-color",
      "rgb(18, 23, 28)",
    );

    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
    await removeDevelopmentToolbar(page);
    await page.screenshot({
      path: "/tmp/royal-p2a-wp4-about-desktop.png",
      fullPage: true,
    });
  });

  test("mobile preserves H1 identity and navigation behavior", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sobre");

    await expect(page.locator("body")).toHaveAttribute(
      "data-site-visual",
      "brand",
    );
    await expectProportionalSignature(page);

    const signature = page.locator(`img[src="${SIGNATURE_PATH}"]`);
    const signatureBounds = await signature.boundingBox();
    expect(signatureBounds).not.toBeNull();
    expect(signatureBounds!.x + signatureBounds!.width).toBeLessThanOrEqual(390);
    await expect(page.locator('img[src*="crown-only"]')).toHaveCount(0);

    const trigger = page.locator("[data-site-nav-trigger]");
    await expect(trigger).toBeVisible();
    await trigger.click();

    const mobileNavigation = page.getByRole("navigation", {
      name: "Navegação móvel",
    });
    const firstLink = mobileNavigation.getByRole("link", {
      name: "Projetos",
      exact: true,
    });
    await expect(firstLink).toBeFocused();

    for (const linkName of [
      "Projetos",
      "Método Royal",
      "Inicie seu projeto",
      "Contato",
    ]) {
      await expect(
        mobileNavigation.getByRole("link", { name: linkName, exact: true }),
      ).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(mobileNavigation).toBeHidden();
    await expect(trigger).toBeFocused();

    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
    await removeDevelopmentToolbar(page);
    await page.screenshot({
      path: "/tmp/royal-p2a-wp4-about-mobile.png",
      fullPage: true,
    });
  });
});

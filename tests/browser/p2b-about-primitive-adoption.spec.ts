import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SIGNATURE_PATH =
  "/brand/identity/signatures/royal-splash-signature-h1-gold.svg";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function expectNoAxeViolations(page: Page): Promise<void> {
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations).toEqual([]);
}

async function expectBrandFoundation(page: Page): Promise<void> {
  await expect(page.locator("body")).toHaveAttribute("data-site-visual", "brand");
  await expect(page.locator("body")).toHaveClass(/site-primitive-page/);
  await expect(page.locator("[data-site-header]")).toHaveAttribute(
    "data-site-header-visual", "brand",
  );
  await expect(page.locator("[data-site-header]").locator(`img[src="${SIGNATURE_PATH}"]`)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Engenharia de água para espaços que permanecem." })).toHaveCSS(
    "font-family", /Cormorant Garamond/,
  );
  await expect(page.locator(".experience-entry .experience-lead").last()).toHaveCSS(
    "font-family", /Hanken Grotesk/,
  );
}

test("desktop adopts shared primitives without changing the approved About surface", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/sobre");
  await expectBrandFoundation(page);

  const conversion = page.locator('[data-about-block="conversion"]');
  await expect(conversion).toHaveClass(/experience-conversion/);
  await expect(conversion).toHaveCSS("background-color", "rgb(18, 23, 28)");
  const primary = conversion.getByRole("link", { name: "Conversar no WhatsApp" });
  await expect(primary).toHaveAttribute("href", "https://wa.me/5521982590643");
  await expect(primary).toHaveClass(/site-primitive-action--primary/);
  await expect(primary).toHaveCSS("font-family", /Hanken Grotesk/);
  await expect(primary).toHaveCSS("border-top-width", "2px");
  await expect(primary).toHaveCSS("border-top-style", "solid");

  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page);
  await page.screenshot({
    path: "/tmp/royal-p2b-wp2-about-desktop.png",
    fullPage: true,
  });
});

test("mobile preserves signature, navigation behavior, and primitive adoption", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sobre");
  await expectBrandFoundation(page);
  await expect(page.locator('img[src*="crown-only"]')).toHaveCount(0);

  const trigger = page.locator("[data-site-nav-trigger]");
  await trigger.click();
  const navigation = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(navigation.getByRole("link", { name: "Projetos", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(navigation).toBeHidden();
  await expect(trigger).toBeFocused();

  const conversion = page.locator('[data-about-block="conversion"]');
  await expect(conversion.getByRole("link", { name: "Conversar no WhatsApp" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page);
  await page.screenshot({
    path: "/tmp/royal-p2b-wp2-about-mobile.png",
    fullPage: true,
  });
});

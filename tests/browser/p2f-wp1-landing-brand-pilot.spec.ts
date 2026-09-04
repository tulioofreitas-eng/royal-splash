import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];

for (const viewport of viewports) {
  test(`fibra Brand pilot at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const response = await page.goto("/lp/fibra");
    expect(response?.ok()).toBe(true);

    const body = page.locator("body");
    await expect(body).toHaveAttribute("data-template-family", "landing");
    await expect(body).toHaveAttribute("data-site-visual", "brand");
    await expect(body).toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(page.locator("main#main-content")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-family", /Cormorant Garamond/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Restauração de Fibra" })).toBeVisible();

    const cta = page.getByRole("link", { name: "Falar com um especialista" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "#orcamento");
    await cta.focus();
    await expect(cta).toBeFocused();
    expect(await cta.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");

    const skip = page.getByRole("link", { name: /pular/i });
    await skip.focus();
    await skip.click();
    await expect(page.locator("main#main-content")).toBeFocused();

    const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

    if (viewport.width === 390) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const whatsapp = page.locator("#btn-abrir-whatsapp");
      const whatsappBox = await whatsapp.boundingBox();
      expect(whatsappBox).not.toBeNull();
      const protectedContent = page.locator("main#main-content :is(h1, h2, h3, p, li, a)");
      for (const element of await protectedContent.all()) {
        if (!(await element.isVisible())) continue;
        const contentBox = await element.boundingBox();
        if (contentBox && whatsappBox) {
          const overlap = !(contentBox.x + contentBox.width <= whatsappBox.x || whatsappBox.x + whatsappBox.width <= contentBox.x || contentBox.y + contentBox.height <= whatsappBox.y || whatsappBox.y + whatsappBox.height <= contentBox.y);
          expect(overlap, `WhatsApp overlaps readable content: ${await element.innerText()}`).toBe(false);
        }
      }
    }

    const scan = await new AxeBuilder({ page }).exclude("#btn-abrir-whatsapp").analyze();
    expect(scan.violations).toEqual([]);
    await page.locator("astro-dev-toolbar").evaluateAll((nodes) => nodes.forEach((node) => node.remove()));
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: `/tmp/royal-p2f-wp1/fibra-${viewport.width}.png`, fullPage: true });
  });
}

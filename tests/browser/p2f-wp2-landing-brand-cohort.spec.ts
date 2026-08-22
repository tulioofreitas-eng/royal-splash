import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];

const routes = [
  { slug: "vazamento", displayHeading: "Detecção de Vazamentos" },
  { slug: "reforma", displayHeading: "Revitalização em cada detalhe" },
];

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

for (const route of routes) {
  for (const viewport of viewports) {
  test(`${route.slug} Brand cohort at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const response = await page.goto(`/lp/${route.slug}`);
    expect(response?.ok()).toBe(true);

    const body = page.locator("body");
    await expect(body).toHaveAttribute("data-template-family", "landing");
    await expect(body).toHaveAttribute("data-site-visual", "brand");
    await expect(body).toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(page.locator("main#main-content")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-family", /Cormorant Garamond/);
    await expect(page.getByRole("heading", { level: 2, name: route.displayHeading })).toHaveCSS("font-family", /Cormorant Garamond/);

    const headings = await page.locator("main :is(h1, h2, h3)").evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
    expect(headings[0]).toBe(1);
    for (let index = 1; index < headings.length; index += 1) expect(headings[index] - headings[index - 1]).toBeLessThanOrEqual(1);

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

    await expect(page.locator("section#orcamento")).toBeAttached();
    const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

    const whatsapp = page.locator("#btn-abrir-whatsapp");
    const whatsappBox = await whatsapp.boundingBox();
    expect(whatsappBox).not.toBeNull();
    const protectedContent = page.locator("main#main-content :is(h1, h2, h3, p, a)");
    for (const element of await protectedContent.all()) {
      if (!(await element.isVisible())) continue;
      const contentBox = await element.boundingBox();
      if (contentBox && whatsappBox) expect(overlaps(contentBox, whatsappBox), `WhatsApp overlaps readable content: ${await element.innerText()}`).toBe(false);
    }

    const ctaBox = await cta.boundingBox();
    if (ctaBox && whatsappBox) expect(overlaps(ctaBox, whatsappBox)).toBe(false);

    const scan = await new AxeBuilder({ page }).exclude("#btn-abrir-whatsapp").analyze();
    expect(scan.violations).toEqual([]);
    await page.locator("astro-dev-toolbar").evaluateAll((nodes) => nodes.forEach((node) => node.remove()));
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
    const screenshotPath = route.slug === "reforma"
      ? `/tmp/royal-p2f-wp2b/reforma-${viewport.width}.png`
      : `/tmp/royal-p2f-wp2a/vazamento-${viewport.width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });
  }
}

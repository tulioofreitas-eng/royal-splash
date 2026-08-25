import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
];

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

for (const viewport of viewports) {
  test(`Piscinas Landing Brand migration at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const whatsappTrackingRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/whatsapp-click") whatsappTrackingRequests.push(request.url());
    });

    const response = await page.goto("/lp/piscinas");
    expect(response?.ok()).toBe(true);

    const body = page.locator("body");
    await expect(body).toHaveAttribute("data-template-family", "landing");
    await expect(body).toHaveAttribute("data-site-visual", "brand");
    await expect(body).toHaveClass(/site-brand-lp-piscinas/);
    await expect(body).toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(page.locator("main#main-content")).toHaveCount(1);

    const h1 = page.getByRole("heading", { level: 1, name: "Piscina de alto padrão com projeto" });
    await expect(h1).toHaveCSS("font-family", /Cormorant Garamond/);
    const headings = await page.locator("main :is(h1, h2, h3)").evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
    expect(headings[0]).toBe(1);
    for (let index = 1; index < headings.length; index += 1) expect(headings[index] - headings[index - 1]).toBeLessThanOrEqual(1);

    const heroCta = page.getByRole("link", { name: "Solicitar orçamento exclusivo" });
    const closingCta = page.getByRole("link", { name: "Falar com um especialista" });
    await expect(heroCta).toHaveAttribute("href", "#orcamento");
    await expect(closingCta).toHaveAttribute("href", "#orcamento");
    await expect(page.locator("section#orcamento")).toBeAttached();
    await expect(page.getByRole("link", { name: "Falar no WhatsApp" })).toHaveCount(0);
    await expect(page.locator("main .abrir-whatsapp-modal")).toHaveCount(0);

    const heroImage = page.locator('img[alt="..."]');
    await expect(heroImage).toHaveAttribute("srcset", /\s390w(?:,|$)/);
    await expect(heroImage).toHaveAttribute("srcset", /\s1792w(?:,|$)/);
    await expect(heroImage).toHaveAttribute("sizes", "100vw");
    await expect(heroImage).toHaveAttribute("loading", "eager");
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");

    const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

    const whatsapp = page.locator("#btn-abrir-whatsapp");
    await expect(whatsapp).toBeVisible();
    const whatsappBox = await whatsapp.boundingBox();
    expect(whatsappBox).not.toBeNull();
    for (const cta of [heroCta, closingCta]) {
      const ctaBox = await cta.boundingBox();
      if (ctaBox && whatsappBox) expect(overlaps(ctaBox, whatsappBox)).toBe(false);
    }

    await whatsapp.click();
    await expect.poll(() => whatsappTrackingRequests.length).toBe(1);

    const skip = page.getByRole("link", { name: /pular/i });
    await skip.focus();
    await skip.click();
    await expect(page.locator("main#main-content")).toBeFocused();

    const scan = await new AxeBuilder({ page }).exclude("#btn-abrir-whatsapp").analyze();
    expect(scan.violations).toEqual([]);
  });
}

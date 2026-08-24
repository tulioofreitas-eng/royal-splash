import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

for (const viewport of viewports) {
  test(`Sauna media-rich Brand landing at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const response = await page.goto("/lp/sauna");
    expect(response?.ok()).toBe(true);

    const body = page.locator("body");
    await expect(body).toHaveAttribute("data-template-family", "landing");
    await expect(body).toHaveAttribute("data-site-visual", "brand");
    await expect(body).toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(page.locator("main#main-content")).toHaveCount(1);

    const h1 = page.getByRole("heading", { level: 1, name: "Transforme sua casa em um refúgio de bem-estar" });
    await expect(h1).toHaveCSS("font-family", /Cormorant Garamond/);
    await expect(page.getByRole("heading", { level: 2, name: "Bem-estar em cada detalhe" })).toHaveCSS("font-family", /Cormorant Garamond/);
    const headings = await page.locator("main :is(h1, h2, h3)").evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
    expect(headings[0]).toBe(1);
    for (let index = 1; index < headings.length; index += 1) expect(headings[index] - headings[index - 1]).toBeLessThanOrEqual(1);

    const heroCta = page.getByRole("link", { name: "Solicitar orçamento exclusivo" });
    const closingCta = page.getByRole("link", { name: "Falar com um especialista" });
    await expect(heroCta).toHaveAttribute("href", "#orcamento");
    await expect(closingCta).toHaveAttribute("href", "#orcamento");
    await heroCta.focus();
    await expect(heroCta).toBeFocused();
    expect(await heroCta.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");

    const skip = page.getByRole("link", { name: /pular/i });
    await skip.focus();
    await skip.click();
    await expect(page.locator("main#main-content")).toBeFocused();

    // Keep the SkipLink accessibility state distinct from canonical visual-collision geometry.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await expect(page.locator("section#orcamento")).toBeAttached();

    const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

    const whatsapp = page.locator("#btn-abrir-whatsapp");
    await expect(whatsapp).toBeVisible();
    const whatsappBox = await whatsapp.boundingBox();
    expect(whatsappBox).not.toBeNull();
    for (const element of await page.locator("main#main-content :is(h1, h2, h3, p, a)").all()) {
      if (!(await element.isVisible())) continue;
      const contentBox = await element.boundingBox();
      if (contentBox && whatsappBox) expect(overlaps(contentBox, whatsappBox), `WhatsApp overlaps readable content: ${await element.innerText()}`).toBe(false);
    }
    for (const cta of [heroCta, closingCta]) {
      const ctaBox = await cta.boundingBox();
      if (ctaBox && whatsappBox) expect(overlaps(ctaBox, whatsappBox)).toBe(false);
    }

    const heroImage = page.getByRole("img", { name: "Sauna e spa de alto padrão" });
    await expect(heroImage).toHaveAttribute("srcset", /\s390w(?:,|$)/);
    await expect(heroImage).toHaveAttribute("srcset", /\s1792w(?:,|$)/);
    await expect(heroImage).toHaveAttribute("sizes", "100vw");

    const expectedAlts = ["Sauna residencial de alto padrão", "Spa e ofurô", "Espaço integrado de spa", "Detalhe do aquecedor de sauna"];
    const galleryButtons = page.locator(".galeria-zoom-item");
    await expect(galleryButtons).toHaveCount(4);
    for (let index = 0; index < expectedAlts.length; index += 1) {
      const thumbnail = galleryButtons.nth(index).getByRole("img", { name: expectedAlts[index] });
      await expect(thumbnail).toBeVisible();
      await expect(thumbnail).toHaveAttribute("srcset", /\s320w(?:,|$)/);
      await expect(thumbnail).toHaveAttribute("sizes", /min-width: 1072px/);
    }
    const firstButton = galleryButtons.first();
    const expectedLightboxSrc = await firstButton.getAttribute("data-lightbox-src");
    await firstButton.click();
    const lightbox = page.locator("#lightbox");
    const lightboxImage = page.locator("#lightbox-img");
    await expect(lightbox).toHaveClass(/flex/);
    await expect(lightboxImage).toHaveAttribute("src", expectedLightboxSrc ?? "");
    await expect(lightboxImage).toHaveAttribute("alt", expectedAlts[0]);
    await lightbox.click({ position: { x: 1, y: 1 } });

    const scan = await new AxeBuilder({ page }).exclude("#btn-abrir-whatsapp").analyze();
    expect(scan.violations).toEqual([]);
    await page.locator("astro-dev-toolbar").evaluateAll((nodes) => nodes.forEach((node) => node.remove()));
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
    await mkdir("/tmp/royal-p2f-wp3a", { recursive: true });
    await page.screenshot({ path: `/tmp/royal-p2f-wp3a/sauna-${viewport.width}.png`, fullPage: true });
  });
}

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
    const leadRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/whatsapp-click") whatsappTrackingRequests.push(request.url());
      if (new URL(request.url()).pathname === "/api/lead") leadRequests.push(request.url());
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

    const heroImage = page.getByAltText("Piscina iluminada em frente a uma residência contemporânea à noite");
    await expect(heroImage).toHaveAttribute("srcset", /\s390w(?:,|$)/);
    await expect(heroImage).toHaveAttribute("srcset", /\s1792w(?:,|$)/);
    await expect(heroImage).toHaveAttribute("sizes", "100vw");
    await expect(heroImage).toHaveAttribute("loading", "eager");
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");

    const faqItems = page.locator(".piscinas-faq__item");
    await expect(faqItems).toHaveCount(5);

    const projectForm = page.locator("[data-piscinas-whatsapp-form]");
    await expect(projectForm).toBeVisible();
    await expect(page.locator('iframe[src*="starterfunnels"]')).toHaveCount(0);

    await page.evaluate(() => document.fonts.ready);
    const ctaTitleBox = await page.locator(".piscinas-cta h2").boundingBox();
    const closingCtaBox = await closingCta.boundingBox();
    expect(ctaTitleBox).not.toBeNull();
    expect(closingCtaBox).not.toBeNull();
    if (ctaTitleBox && closingCtaBox) {
      expect(closingCtaBox.y).toBeGreaterThanOrEqual(ctaTitleBox.y + ctaTitleBox.height);
      if (viewport.width > 832) {
        expect(Math.abs(closingCtaBox.x - ctaTitleBox.x)).toBeLessThanOrEqual(1);
      } else {
        const titleCenter = ctaTitleBox.x + ctaTitleBox.width / 2;
        const ctaCenter = closingCtaBox.x + closingCtaBox.width / 2;
        expect(Math.abs(titleCenter - ctaCenter)).toBeLessThanOrEqual(1);
      }
    }

    const faqTitleBox = await page.locator(".piscinas-faq h2").boundingBox();
    const faqListBox = await page.locator(".piscinas-faq__list").boundingBox();
    expect(faqTitleBox).not.toBeNull();
    expect(faqListBox).not.toBeNull();
    if (faqTitleBox && faqListBox) {
      if (viewport.width > 832) {
        const titleCenter = faqTitleBox.y + faqTitleBox.height / 2;
        const listCenter = faqListBox.y + faqListBox.height / 2;
        expect(Math.abs(titleCenter - listCenter)).toBeLessThanOrEqual(1);
        expect(faqTitleBox.x).toBeLessThan(faqListBox.x);
      } else {
        expect(faqTitleBox.y + faqTitleBox.height).toBeLessThanOrEqual(faqListBox.y);
      }
    }

    const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

    await heroCta.click();
    await expect(page).toHaveURL(/#orcamento$/);
    await expect(page.locator("section#orcamento")).toBeInViewport();

    await projectForm.getByRole("button", { name: "Abrir conversa no WhatsApp" }).click();
    await expect(page.locator("[data-error-for=nome]")).toHaveText("Informe seu nome.");
    await expect(page.locator("[data-error-for=consentimento]")).toHaveText("Confirme o consentimento antes de continuar.");

    await page.evaluate(() => {
      const browserWindow = window as Window & {
        __piscinasWhatsAppUrl?: string;
        __piscinasHandoffDetail?: unknown;
      };
      window.addEventListener("site:whatsapp-handoff-initiated", (event) => {
        browserWindow.__piscinasHandoffDetail = (event as CustomEvent).detail;
      });
      window.open = ((url?: string | URL) => {
        browserWindow.__piscinasWhatsAppUrl = String(url ?? "");
        return window;
      }) as typeof window.open;
    });

    await page.getByLabel("Nome Obrigatório").fill("Cliente Teste");
    await page.getByLabel("Espaço ou necessidade Opcional").fill("Piscina integrada ao deck existente");
    await page.getByLabel("Prazo Opcional").selectOption("proximos_meses");
    await page.getByLabel(/Autorizo preparar estas informações/).check();
    await projectForm.getByRole("button", { name: "Abrir conversa no WhatsApp" }).click();

    const handoff = await page.evaluate(() => {
      const browserWindow = window as Window & {
        __piscinasWhatsAppUrl?: string;
        __piscinasHandoffDetail?: unknown;
      };
      return {
        url: browserWindow.__piscinasWhatsAppUrl,
        detail: browserWindow.__piscinasHandoffDetail,
        pageUrl: window.location.href,
      };
    });
    expect(handoff.url).toContain("https://wa.me/5521982590643?text=");
    const message = decodeURIComponent(new URL(handoff.url!).searchParams.get("text") ?? "");
    expect(message).toContain("Nome: Cliente Teste");
    expect(message).toContain("Interesse: Piscinas");
    expect(message).toContain("Espaço ou necessidade: Piscina integrada ao deck existente");
    expect(handoff.detail).toEqual({ componentRef: "lp_piscinas_whatsapp_form", subjectRef: "piscinas", channelRef: "whatsapp" });
    expect(handoff.pageUrl).not.toContain("Cliente");
    expect(handoff.pageUrl).toMatch(/\/lp\/piscinas#orcamento$/);
    expect(leadRequests).toEqual([]);
    await expect(page.locator("[data-whatsapp-fallback]")).toBeVisible();
    await expect(page.locator("[data-composed-message]")).toHaveValue(message);

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

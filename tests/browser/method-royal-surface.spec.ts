import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test.describe("Método Royal page closure R1", () => {
  test("maps the four approved process concepts in sequence", async ({ page }) => {
    await page.goto("/metodo-royal");

    const expected = [
      ["01", "Primeira conversa", /Conversa de entendimento do projeto/],
      ["02", "Clareza técnica", /planta, materiais, régua de medição e calculadora/],
      ["03", "Execução acompanhada", /supervisor técnico de capacete e tablet/],
      ["04", "Conclusão e apoio", /Inspeção final de piscina concluída/],
    ] as const;

    for (const [number, heading, alt] of expected) {
      const step = page.locator(`[data-method-step="${number}"]`);
      await expect(step.getByRole("heading", { level: 3, name: heading })).toBeVisible();
      await expect(step.getByRole("img", { name: alt })).toBeVisible();
    }
  });

  test("keeps the desktop process heading on one line", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/metodo-royal");
    const heading = page.getByRole("heading", { level: 2, name: "Entendimento → Escopo → Obra → Entrega" });
    await expect(heading).toBeVisible();
    expect(await heading.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getClientRects().length;
    })).toBe(1);
  });

  test("preserves responsive integrity, intrinsic image ratios and natural scroll", async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/metodo-royal");
      await expectNoHorizontalOverflow(page);
      expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true);

      const imageResults = await page.locator(".method-depth > li > img").evaluateAll((images) => images.map((image) => {
        const img = image as HTMLImageElement;
        const renderedRatio = img.getBoundingClientRect().width / img.getBoundingClientRect().height;
        const intrinsicRatio = img.naturalWidth / img.naturalHeight;
        return { complete: img.complete, naturalWidth: img.naturalWidth, ratioDelta: Math.abs(renderedRatio - intrinsicRatio) };
      }));

      expect(imageResults).toHaveLength(4);
      for (const result of imageResults) {
        expect(result.complete).toBe(true);
        expect(result.naturalWidth).toBeGreaterThan(0);
        expect(result.ratioDelta).toBeLessThan(0.01);
      }
    }
  });

  test("has no serious or critical axe violations and preserves preview indexing safety", async ({ page }) => {
    await page.goto("/metodo-royal");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/);

    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
  });

  test("loads without broken images or console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/metodo-royal");
    await page.waitForLoadState("networkidle");
    expect(await page.locator(".method-depth img").evaluateAll((images) => images.filter((image) => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0).length)).toBe(0);
    expect(errors).toEqual([]);
  });
});

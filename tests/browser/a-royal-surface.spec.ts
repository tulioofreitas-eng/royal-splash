import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];

async function expectNoHorizontalOverflow(page: Page, width: number): Promise<void> {
  const result = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll("body *")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
    }).slice(0, 8).map((element) => ({ tag: element.tagName, className: element.className, rect: element.getBoundingClientRect().toJSON() })),
  }));
  expect(result, `horizontal overflow at ${width}px`).toMatchObject({ scrollWidth: result.clientWidth, offenders: [] });
}

test.describe("A Royal Founder gate composition repair R1", () => {
  test("composes exactly three practice principles without an empty quadrant", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/sobre");

    const cards = page.locator('[data-about-block="practice"] .experience-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.locator("h3")).toHaveText(["Projeto", "Execução", "Relacionamento"]);
    await expect(cards.locator("span")).toHaveText(["01", "02", "03"]);

    const geometry = await cards.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), width: Math.round(rect.width) };
    }));
    expect(new Set(geometry.map(({ top }) => top)).size).toBe(1);
    expect(Math.max(...geometry.map(({ width }) => width)) - Math.min(...geometry.map(({ width }) => width))).toBeLessThanOrEqual(1);
  });

  test("places the existing photo and context directly after practice and before identity", async ({ page }) => {
    await page.goto("/sobre");
    expect(await page.locator("[data-about-block]").evaluateAll((blocks) => blocks.map((block) => block.getAttribute("data-about-block")))).toEqual([
      "entry",
      "photo-context",
      "practice",
      "identity",
      "conversion",
    ]);
    await expect(page.getByRole("img", { name: "Equipe Royal Splash em contexto de trabalho" })).toHaveCount(1);
  });

  test("keeps Identity title, copy and actions in one bounded hierarchy", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/sobre");
    const content = page.locator(".about-identity__content");
    await expect(content.getByText("Identidade", { exact: true })).toBeVisible();
    await expect(content.getByRole("heading", { level: 2, name: "A prática aparece no trabalho." })).toBeVisible();
    await expect(content.getByText("Fotografia de projetos, capacidades técnicas concretas, documentação de escopo e contato direto mostram como a Royal atua hoje.")).toBeVisible();
    await expect(content.getByRole("link", { name: "Ver Acervo" })).toHaveAttribute("href", "/projetos");
    await expect(content.getByRole("link", { name: "Ver Método Royal" })).toHaveAttribute("href", "/metodo-royal");

    const relationship = await content.evaluate((element) => {
      const title = element.querySelector("h2")!.getBoundingClientRect();
      const support = element.querySelector(".about-identity__support")!.getBoundingClientRect();
      const kicker = element.querySelector(".experience-kicker")!.getBoundingClientRect();
      return {
        kickerAbove: kicker.bottom <= Math.min(title.top, support.top),
        paired: support.left > title.right,
        aligned: Math.abs(title.bottom - support.bottom) < 8,
      };
    });
    expect(relationship).toEqual({ kickerAbove: true, paired: true, aligned: true });
  });

  test("preserves responsive integrity and natural scroll at all required widths", async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/sobre");
      await expectNoHorizontalOverflow(page, viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true);
      await expect(page.getByRole("heading", { level: 1, name: "Engenharia de água para espaços que permanecem." })).toBeVisible();
    }
  });

  test("has no broken images, console errors, or serious accessibility defects", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/sobre");
    await page.waitForLoadState("networkidle");
    expect(await page.locator("img").evaluateAll((images) => images.filter((image) => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0).length)).toBe(0);
    expect(errors).toEqual([]);

    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/);
  });
});

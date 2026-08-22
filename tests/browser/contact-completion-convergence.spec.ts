import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("auxiliary Contact convergence", () => {
  test("exposes contact channels without a competing lead form", async ({ page }) => {
    const response = await page.goto("/contato");
    expect(response?.ok()).toBe(true);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contato");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Iniciar um projeto" }))
      .toHaveAttribute("href", "/inicie-seu-projeto");
    const channels = page.getByRole("region", { name: "Outros canais de contato" });
    await expect(channels.getByRole("link", { name: "WhatsApp", exact: true }))
      .toHaveAttribute("href", "https://wa.me/5521982590643");
    await expect(channels.getByRole("link", { name: "Instagram", exact: true }))
      .toHaveAttribute("href", "https://instagram.com/royalsplashoficial");
    await expect(page.getByRole("link", { name: "(21) 98259-0643" }))
      .toHaveAttribute("href", "tel:+5521982590643");
    await expect(page.getByRole("link", { name: "contato@royalsplash.com.br" }))
      .toHaveAttribute("href", "mailto:contato@royalsplash.com.br");

    await expect(page.locator("form[data-lead-form], main form")).toHaveCount(0);
    for (const name of ["nome", "telefone", "email", "cidade", "tipo_projeto", "mensagem"]) {
      await expect(page.locator(`main [name="${name}"]`)).toHaveCount(0);
    }
  });

  test("reaches the structured-intake route by keyboard", async ({ page }) => {
    await page.goto("/contato");
    const cta = page.getByRole("link", { name: "Iniciar um projeto" });
    await cta.focus();
    await expect(cta).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/inicie-seu-projeto$/);
    await expect(page.locator("[data-structured-intake]")).toBeVisible();
  });

  test("has no unexpected automated accessibility violations", async ({ page }) => {
    await page.goto("/contato");
    const results = await new AxeBuilder({ page }).include("main").analyze();
    expect(results.violations).toEqual([]);
  });

  for (const width of [390, 768, 1440]) {
    test(`keeps channels usable without horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/contato");
      await expect(page.getByRole("link", { name: "Iniciar um projeto" })).toBeVisible();
      const channels = page.getByRole("region", { name: "Outros canais de contato" });
      await expect(channels.getByRole("link", { name: "WhatsApp", exact: true })).toBeVisible();
      await expect(channels.getByRole("link", { name: "Instagram", exact: true })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }
});

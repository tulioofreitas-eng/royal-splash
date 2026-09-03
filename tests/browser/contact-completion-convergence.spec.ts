import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("auxiliary Contact convergence", () => {
  test("exposes contact channels without a competing lead form", async ({ page }) => {
    const response = await page.goto("/contato");
    expect(response?.ok()).toBe(true);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos os canais diretos da Royal Splash.");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByText("Use o WhatsApp para uma conversa imediata ou escolha o canal que funciona melhor para você."))
      .toBeVisible();
    await expect(page.locator('main a[href^="/inicie-seu-projeto"]')).toHaveCount(1);
    await expect(page.getByText(/formulário estruturado/i)).toHaveCount(0);
    const channels = page.getByRole("region", { name: "Canais diretos" });
    await expect(channels.getByRole("link", { name: "WhatsApp" }))
      .toHaveAttribute("href", "https://wa.me/5521982590643");
    await expect(channels.getByRole("link", { name: "Instagram" }))
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

  test("keeps a proven contact action keyboard reachable without exposing StructuredIntake", async ({ page }) => {
    await page.goto("/contato");
    const channels = page.getByRole("region", { name: "Canais diretos" });
    const whatsapp = channels.getByRole("link", { name: "WhatsApp" });
    await whatsapp.focus();
    await expect(whatsapp).toBeFocused();
    await expect(whatsapp).toHaveAttribute("href", "https://wa.me/5521982590643");
    await expect(page.locator('main a[href^="/inicie-seu-projeto"]')).toHaveCount(1);
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
      await expect(page.getByText("Use o WhatsApp para uma conversa imediata ou escolha o canal que funciona melhor para você."))
        .toBeVisible();
      await expect(page.locator('main a[href^="/inicie-seu-projeto"]')).toHaveCount(1);
      const channels = page.getByRole("region", { name: "Canais diretos" });
      await expect(channels.getByRole("link", { name: "WhatsApp" })).toBeVisible();
      await expect(channels.getByRole("link", { name: "Instagram" })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [390, 430, 768, 1440]) {
  test(`SC-R12 Home and Contato remain responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    for (const route of ["/", "/contato"]) {
      await page.goto(route);
      await expect(page.locator("[data-experience-motion]")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
}

test("SC-R12 reduced motion renders static, complete content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-experience-motion]")).toHaveAttribute("data-motion-preference", "reduced");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-motion-reveal]").first()).toHaveCSS("transform", "none");
});

test("SC-R12 pages expose no automated axe violations", async ({ page }) => {
  for (const route of ["/", "/contato"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, route).toEqual([]);
  }
});

test("SC-R12 preserves route and auxiliary-channel integrity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explorar Residencial" })).toHaveAttribute("href", "/servicos");
  await expect(page.getByRole("link", { name: "Explorar Corporativo / Institucional" })).toHaveAttribute("href", "/corporativo");
  await expect(page.getByRole("link", { name: "Inicie seu projeto", exact: true }).first()).toHaveAttribute("href", "/contato");
  await page.goto("/contato");
  await expect(page.locator("main form, main [data-structured-intake]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/5521982590643");
});

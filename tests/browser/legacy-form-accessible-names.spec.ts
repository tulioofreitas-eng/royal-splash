import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Contato removes the dormant qualification modal and keeps direct channels named", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/contato");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("#whatsapp-modal")).toHaveCount(0);
  const channels = page.getByRole("region", { name: "Canais diretos" });
  await expect(channels.getByRole("link", { name: "WhatsApp" }))
    .toHaveAttribute("href", "https://wa.me/5521982590643");
  await expect(page.locator("main form")).toHaveCount(0);

  const accessibility = await new AxeBuilder({ page })
    .withRules(["label", "select-name"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

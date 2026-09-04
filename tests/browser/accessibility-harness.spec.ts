import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("representative Site runtime exposes browser accessibility foundations", async ({
  page,
}) => {
  await page.goto("/sobre");

  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

  const main = page.getByRole("main");
  await expect(main).toHaveCount(1);
  await expect(main).toHaveAttribute("id", "main-content");

  const skipLink = page.getByRole("link", {
    name: "Pular para o conteúdo principal",
  });

  await expect(skipLink).toHaveAttribute("href", "#main-content");

  await skipLink.focus();
  await expect(skipLink).toBeFocused();

  const accessibilityScanResults = await new AxeBuilder({
    page,
  }).analyze();

  expect(
    accessibilityScanResults.violations,
  ).toEqual([]);

  console.log(
    `AXE_BASELINE_VIOLATIONS=${accessibilityScanResults.violations.length}`,
  );
});

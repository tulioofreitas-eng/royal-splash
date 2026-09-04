import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const missingRoute = "/rota-inexistente-sc-r4";

test("unknown paths preserve HTTP 404 and render the canonical recovery shell", async ({
  page,
}) => {
  const response = await page.goto(missingRoute);

  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-not-found-surface]")).toHaveCount(1);
  await expect(page.locator("[data-site-header]")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Página não encontrada",
  );

  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute("content", "noindex, nofollow");
});

test("404 recovery links and skip link remain keyboard accessible", async ({ page }) => {
  await page.goto(missingRoute);

  const homeLink = page.getByRole("main").getByRole("link", {
    name: "Voltar ao início",
  });
  await expect(homeLink).toHaveAttribute("href", "/");
  await homeLink.focus();
  await expect(homeLink).toBeFocused();
  expect(await homeLink.evaluate((element) => getComputedStyle(element).outlineStyle))
    .not.toBe("none");

  const projectsLink = page.getByRole("main").getByRole("link", {
    name: "Ver Projetos",
  });
  await expect(projectsLink).toHaveAttribute("href", "/projetos");

  const skipLink = page.getByRole("link", {
    name: "Pular para o conteúdo principal",
  });
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.click();
  await expect(page.getByRole("main")).toBeFocused();
});

test("404 has no Axe violations or responsive overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(missingRoute);

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
  console.log(
    `AXE_404_VIOLATIONS=${accessibilityScanResults.violations.length}`,
  );

  const mobileDimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(mobileDimensions.scrollWidth).toBeLessThanOrEqual(
    mobileDimensions.clientWidth,
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  const contentWidth = await page.locator("[data-not-found-surface]").evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  expect(contentWidth).toBeLessThanOrEqual(1152);
});

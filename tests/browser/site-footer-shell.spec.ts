import { expect, test } from "@playwright/test";

const canonicalRoutes = [
  "/",
  "/servicos",
  "/corporativo",
  "/projetos",
  "/metodo-royal",
  "/sobre",
  "/inicie-seu-projeto",
];

test("public canonical Site routes render exactly one footer landmark", async ({ page }) => {
  for (const route of canonicalRoutes) {
    await page.goto(route);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  }
});

test("footer exposes canonical, accessible navigation", async ({ page }) => {
  await page.goto("/sobre");

  const footer = page.getByRole("contentinfo");
  const navigation = footer.getByRole("navigation", {
    name: "Navegação do rodapé",
  });

  for (const [name, href] of [
    ["Início", "/"],
    ["Projetos", "/projetos"],
    ["Residencial", "/servicos"],
    ["Corporativo / Institucional", "/corporativo"],
    ["Método Royal", "/metodo-royal"],
    ["A Royal", "/sobre"],
    ["Inicie seu projeto", "/inicie-seu-projeto"],
    ["Contato", "/contato"],
    ["Política de Privacidade", "/politica-de-privacidade"],
  ]) {
    await expect(navigation.getByRole("link", { name, exact: true }))
      .toHaveAttribute("href", href);
  }

  const projectLink = navigation.getByRole("link", {
    name: "Inicie seu projeto",
    exact: true,
  });
  await projectLink.focus();
  await expect(projectLink).toBeFocused();
  expect(await projectLink.evaluate((element) => getComputedStyle(element).outlineStyle))
    .not.toBe("none");
});

test("footer respects mobile overflow and desktop content width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sobre");

  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);

  await page.setViewportSize({ width: 1440, height: 900 });
  const innerWidth = await page.locator(".site-footer__inner").evaluate(
    (element) => element.getBoundingClientRect().width,
  );

  expect(innerWidth).toBeLessThanOrEqual(1152);
});

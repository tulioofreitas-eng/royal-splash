import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["/", "Encontre o contexto certo para avançar."],
  ["/servicos", "Residencial"],
  ["/corporativo", "Corporativo / Institucional"],
  ["/projetos", "Projetos"],
  ["/metodo-royal", "Método Royal"],
  ["/sobre", "A Royal"],
  ["/inicie-seu-projeto", "Inicie seu projeto"],
  ["/404", "Página não encontrada"],
] as const;

const prohibited = /implementação|implementado|implementada|funcional|governança|governado|governada|controlado|controlada|superfície institucional|fluxo estruturado|verificação|verificado|verificada|publicação|publicável|publicado|publicada|disponível para publicação|catálogo controlado|registro controlado|intake/i;

test("canonical launch surfaces render visitor-facing copy in the shared shell", async ({
  page,
}) => {
  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.locator("[data-site-header]")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.locator("[data-site-footer]")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("main")).not.toContainText(prohibited);
  }
});

test("canonical convergence preserves navigation, segment intake destinations, and Projects empty state", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Inicie seu projeto" }).first()).toHaveAttribute(
    "href",
    "/inicie-seu-projeto",
  );

  for (const [route, context] of [
    ["/servicos", "residencial"],
    ["/corporativo", "corporativo_institucional"],
  ] as const) {
    await page.goto(route);
    await expect(page.locator("[data-segment-qualified-action]").first()).toHaveAttribute(
      "href",
      `/inicie-seu-projeto?context=${context}`,
    );
  }

  await page.goto("/projetos");
  await expect(page.locator('[data-projects-state="empty"]')).toContainText(
    "Nenhum projeto disponível no momento",
  );
});

test("representative converged surfaces remain accessible and responsive", async ({
  page,
}) => {
  for (const route of ["/", "/projetos", "/metodo-royal", "/sobre"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${route} axe violations`).toEqual([]);
  }

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/servicos", "/projetos", "/metodo-royal", "/sobre"]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
        `${route} overflows at ${width}px`,
      ).toBe(true);
      await expect(page.getByRole("link", { name: "Inicie seu projeto" }).first()).toBeVisible();
    }
  }
});

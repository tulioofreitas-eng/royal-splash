import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["/", "Água como parte da arquitetura."],
  ["/servicos", "Água integrada ao projeto de habitar."],
  ["/corporativo", "Engenharia aquática para uso coletivo."],
  ["/projetos", "Fotografias de projetos realizados."],
  ["/metodo-royal", "Como a conversa se organiza em execução."],
  ["/sobre", "Engenharia de água para espaços que permanecem."],
  ["/inicie-seu-projeto", "Organize seu contexto para uma conversa mais útil."],
  ["/404", "Página não encontrada"],
] as const;

const prohibited = /implementação|implementado|implementada|funcional|governança|governado|governada|controlado|controlada|superfície institucional|fluxo estruturado|publicação|publicável|publicado|publicada|disponível para publicação|catálogo controlado|registro controlado/i;

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

test("canonical convergence preserves conversion destinations and Projects gallery state", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Inicie seu projeto" }).first()).toHaveAttribute(
    "href",
    "/inicie-seu-projeto",
  );

  for (const route of [
    "/servicos",
    "/corporativo",
  ] as const) {
    await page.goto(route);
    await expect(
      page.getByRole("main").locator('.site-primitive-action--primary[data-analytics-cta]').first(),
    ).toHaveAttribute("href", "https://wa.me/5521982590643");
  }

  await page.goto("/projetos");
  await expect(page.locator('[data-project-gallery]')).toBeVisible();
  await expect(page.locator('[data-project-gallery]')).toHaveAttribute("data-projects-count", /^\d+$/);
});

test("normal primary conversion surfaces have no lingering /contato default routing", async ({ page }) => {
  const expectedChannels: Record<string, { href: string; channel: string } | null> = {
    "/": { href: "/inicie-seu-projeto", channel: "site_form" },
    "/metodo-royal": null,
    "/projetos": { href: "https://wa.me/5521982590643", channel: "whatsapp" },
    "/sobre": null,
    "/servicos": { href: "https://wa.me/5521982590643", channel: "whatsapp" },
    "/corporativo": { href: "https://wa.me/5521982590643", channel: "whatsapp" },
  };

  for (const [route, expected] of Object.entries(expectedChannels)) {
    await page.goto(route);
    const primaryActions = page.getByRole("main").locator(
      '.site-primitive-action--primary[data-analytics-cta]',
    );
    const count = await primaryActions.count();
    if (expected === null) {
      expect(count).toBe(0);
      continue;
    }
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(primaryActions.nth(index)).toHaveAttribute("href", expected.href);
      await expect(primaryActions.nth(index)).toHaveAttribute(
        "data-analytics-channel",
        expected.channel,
      );
      await expect(primaryActions.nth(index)).not.toHaveAttribute("href", "/contato");
    }
  }
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

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Home Brand orchestration", () => {
  test("implements the approved context-to-qualified-action journey", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      "pt-BR",
    );

    const main = page.getByRole("main");
    const entry = main.locator('[data-home-stage="entry"]');

    await expect(entry.getByText("Royal Splash", { exact: true })).toBeVisible();
    await expect(entry.getByText(
      "Explore o contexto relevante, consulte projetos e evidências disponíveis e avance quando estiver pronto para iniciar seu projeto.",
      { exact: true },
    )).toBeVisible();
    await expect(entry.getByRole("link", { name: "Inicie seu projeto", exact: true }))
      .toHaveAttribute("href", "/inicie-seu-projeto");
    await expect(entry.getByRole("link", { name: "Ver Projetos" }))
      .toHaveAttribute("href", "/projetos");

    await expect(
      main.getByRole("heading", {
        level: 1,
        name: "Encontre o contexto certo para avançar.",
      }),
    ).toBeVisible();

    const segmentRouter = main.getByRole("region", {
      name: "Escolha seu contexto",
    });

    await expect(segmentRouter.getByText(
      "Siga pela experiência que corresponde ao contexto do seu projeto.",
      { exact: true },
    )).toBeVisible();
    await expect(segmentRouter.getByText(
      "Explore a jornada destinada a necessidades em contexto residencial.",
      { exact: true },
    )).toBeVisible();
    await expect(segmentRouter.getByText(
      "Explore a jornada destinada a contextos corporativos ou institucionais.",
      { exact: true },
    )).toBeVisible();

    await expect(
      segmentRouter.getByRole("link", {
        name: "Explorar Residencial",
      }),
    ).toHaveAttribute("href", "/servicos");

    await expect(
      segmentRouter.getByRole("link", {
        name: "Explorar Corporativo / Institucional",
      }),
    ).toHaveAttribute("href", "/corporativo");

    await expect(
      main.getByRole("link", {
        name: "Explorar Projetos",
      }),
    ).toHaveAttribute("href", "/projetos");
    await expect(main.getByText(
      "Consulte a área de Projetos para acessar conteúdo de prova estruturado conforme evidências verificadas estiverem disponíveis.",
      { exact: true },
    )).toBeVisible();

    await expect(
      main.getByRole("link", {
        name: "Conhecer Método Royal",
      }),
    ).toHaveAttribute("href", "/metodo-royal");
    await expect(main.getByText(
      "Entenda a estrutura de método e processo sustentada pelas evidências disponíveis.",
      { exact: true },
    )).toBeVisible();

    await expect(
      main.getByRole("link", {
        name: "Conhecer A Royal",
      }),
    ).toHaveAttribute("href", "/sobre");
    await expect(main.getByText(
      "Acesse a superfície institucional destinada à compreensão e confiança sobre a Royal.",
      { exact: true },
    )).toBeVisible();

    const qualifiedActions = main.getByRole("link", {
      name: "Inicie seu projeto",
      exact: true,
    });

    await expect(qualifiedActions).toHaveCount(2);

    for (let index = 0; index < 2; index += 1) {
      await expect(
        qualifiedActions.nth(index),
      ).toHaveAttribute(
        "href",
        "/inicie-seu-projeto",
      );
    }

    await expect(
      main.getByRole("link", {
        name: "Contato e canais auxiliares",
      }),
    ).toHaveAttribute("href", "/contato");

    const entryAction = entry.getByRole("link", { name: "Inicie seu projeto", exact: true });
    const finalStage = main.locator('[data-home-stage="qualified-action"]');
    const finalAction = finalStage.getByRole("link", { name: "Inicie seu projeto", exact: true });
    await expect(finalStage.getByText(
      "Quando fizer sentido avançar, compartilhe o contexto do seu projeto pelo fluxo estruturado.",
      { exact: true },
    )).toBeVisible();
    await expect(entryAction).toHaveAttribute("data-analytics-component", "home_entry");
    await expect(finalAction).toHaveAttribute("data-analytics-component", "home_qualified_action");
    for (const action of [entryAction, finalAction]) {
      await expect(action).toHaveAttribute("data-analytics-subject", "project_start");
      await expect(action).toHaveAttribute("data-analytics-channel", "site_form");
    }
  });

  test("activates canonical Brand typography, colors, identity, and font delivery", async ({ page }) => {
    const brandFontRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/brand/fonts/")) brandFontRequests.push(request.url());
    });

    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    const body = page.locator("body");
    const heading = page.getByRole("heading", { level: 1 });
    const finalStage = page.locator('[data-home-stage="qualified-action"]');

    await expect(body).toHaveAttribute("data-site-visual", "brand");
    await expect(body).toHaveClass(/site-primitive-page/);
    await expect(page.locator("[data-site-header]"))
      .toHaveAttribute("data-site-header-visual", "brand");
    await expect(page.locator('img[src="/brand/identity/signatures/royal-splash-signature-h1-gold.svg"]'))
      .toBeVisible();
    await expect(heading).toHaveText("Encontre o contexto certo para avançar.");
    await expect(heading).toHaveCSS("font-family", /Cormorant Garamond/);
    await expect(page.locator('[data-home-stage="entry"] > p').last())
      .toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(body).toHaveCSS("background-color", "rgb(250, 249, 246)");
    await expect(body).toHaveCSS("color", "rgb(18, 23, 28)");
    await expect(finalStage).toHaveCSS("background-color", "rgb(18, 23, 28)");
    await expect(finalStage).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(brandFontRequests.some((url) => url.includes("HankenGrotesk"))).toBe(true);
    expect(brandFontRequests.some((url) => url.includes("CormorantGaramond"))).toBe(true);
  });

  test("preserves heading order and visible keyboard focus", async ({ page }) => {
    await page.goto("/");
    const levels = await page.locator("main h1, main h2, main h3").evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
    );
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
    }

    const entry = page.locator('[data-home-stage="entry"]');
    const primary = entry.getByRole("link", { name: "Inicie seu projeto", exact: true });
    const secondary = entry.getByRole("link", { name: "Ver Projetos" });
    await primary.focus();
    await expect(primary).toBeFocused();
    expect(await primary.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    await page.keyboard.press("Tab");
    await expect(secondary).toBeFocused();
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    test(`has responsive integrity at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("heading", {
        level: 1,
        name: "Encontre o contexto certo para avançar.",
      })).toBeVisible();
      await expect(page.locator('[data-home-stage="entry"] .site-primitive-actions')).toBeVisible();
      await expect(page.locator("[data-segment-router] .segment-router__options")).toBeVisible();
      await expect(page.locator('[data-home-stage="method-trust"] .home-bridge-grid')).toBeVisible();
      await expect(page.locator('[data-home-stage="qualified-action"]')).toBeVisible();
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      )).toBe(true);
    });
  }

  test("new Home architecture has no automated axe violations", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto("/");

    const accessibilityScanResults =
      await new AxeBuilder({
        page,
      }).analyze();

    expect(
      accessibilityScanResults.violations,
    ).toEqual([]);
  });
});

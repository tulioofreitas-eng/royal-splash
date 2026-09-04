import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Home Brand orchestration", () => {
  test("implements the approved cinematic-hero to structured-conversion journey", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      "pt-BR",
    );

    const main = page.getByRole("main");
    const entry = main.locator('[data-home-stage="entry"]');

    await expect(
      main.getByRole("heading", {
        level: 1,
        name: "Água como parte da arquitetura.",
      }),
    ).toBeVisible();
    await expect(entry.getByText(
      "Projetamos e executamos soluções aquáticas com leitura técnica, integração ao espaço e atenção à experiência final.",
      { exact: true },
    )).toBeVisible();
    await expect(entry.getByRole("link", { name: "Inicie seu projeto", exact: true }))
      .toHaveAttribute("href", "/inicie-seu-projeto");
    await expect(entry.getByRole("link", { name: "Explorar projetos" }))
      .toHaveAttribute("href", "/projetos");

    const contextTransition = main.locator(".context-transition");
    await expect(
      contextTransition.getByRole("link", { name: /Residencial/ }),
    ).toHaveAttribute("href", "/servicos");
    await expect(
      contextTransition.getByRole("link", { name: /Corporativo \/ Institucional/ }),
    ).toHaveAttribute("href", "/corporativo");

    const capabilities = main.locator(".capabilities");
    for (const capability of ["Piscinas", "Sauna", "Lazer", "Reforma", "Vazamento", "Fibra"]) {
      await expect(capabilities.getByText(capability)).toBeVisible();
    }

    await expect(
      main.locator(".proof-stage").getByRole("link", { name: "Ver Acervo" }),
    ).toHaveAttribute("href", "/projetos");

    await expect(
      main.locator(".method-stage").getByRole("link", { name: "Conhecer o método" }),
    ).toHaveAttribute("href", "/metodo-royal");

    const homeFinal = main.locator(".home-final");
    const finalAction = homeFinal.getByRole("link", { name: "Fale com a Royal" });
    await expect(finalAction).toHaveAttribute("href", "/inicie-seu-projeto");
    await expect(finalAction).toHaveAttribute("data-analytics-subject", "project_start");
    await expect(finalAction).toHaveAttribute("data-analytics-channel", "site_form");
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
    const homeFinal = page.locator(".home-final");

    await expect(body).toHaveAttribute("data-site-visual", "brand");
    await expect(body).toHaveClass(/site-primitive-page/);
    await expect(page.locator("[data-site-header]"))
      .toHaveAttribute("data-site-header-visual", "brand");
    await expect(page.locator("[data-site-header]").locator('img[src="/brand/identity/signatures/royal-splash-signature-h1-gold.svg"]'))
      .toBeVisible();
    await expect(heading).toHaveText("Água como parte da arquitetura.");
    await expect(heading).toHaveCSS("font-family", /Cormorant Garamond/);
    await expect(page.locator('[data-home-stage="entry"] .cinematic-hero__content > p:not(.kicker)'))
      .toHaveCSS("font-family", /Hanken Grotesk/);
    await expect(body).toHaveCSS("background-color", "rgb(250, 249, 246)");
    await expect(body).toHaveCSS("color", "rgb(18, 23, 28)");
    await expect(homeFinal).toHaveCSS("background-color", "rgb(18, 23, 28)");
    await expect(homeFinal).toHaveCSS("color", "rgb(255, 255, 255)");
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
    const secondary = entry.getByRole("link", { name: "Explorar projetos" });
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
        name: "Água como parte da arquitetura.",
      })).toBeVisible();
      await expect(page.locator('[data-home-stage="entry"] .actions')).toBeVisible();
      await expect(page.locator(".context-transition")).toBeVisible();
      await expect(page.locator(".home-final")).toBeVisible();
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

  test("hero H1 and CTA row remain in the accessibility tree and keyboard-operable at immediate load", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const results = await new AxeBuilder({ page })
      .withRules(["page-has-heading-one"])
      .analyze();
    expect(results.violations).toEqual([]);

    const heading = page.getByRole("heading", { level: 1 });
    const entry = page.locator('[data-home-stage="entry"]');
    const actions = entry.locator(".actions");
    const primary = actions.getByRole("link", { name: "Inicie seu projeto", exact: true });
    const secondary = actions.getByRole("link", { name: "Explorar projetos" });

    // Never removed from the accessibility tree (visibility never toggles
    // to "hidden"), regardless of where the entrance fade currently is.
    expect(await heading.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
    expect(await actions.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");

    // Interactive and reachable by keyboard immediately, even mid-fade.
    await primary.focus();
    await expect(primary).toBeFocused();
    await expect(primary).toHaveAttribute("href", "/inicie-seu-projeto");
    await page.keyboard.press("Tab");
    await expect(secondary).toBeFocused();
  });

  test("hero entrance animation still fades the CTA row in without ever hiding it, and settles at full opacity", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const actions = page.locator('[data-home-stage="entry"] .actions');

    // Poll across the ~1.3s entrance timeline: visibility must never drop
    // to "hidden" at any sampled point, proving the CTA row is exposed to
    // assistive tech throughout the cinematic fade, not just at the end.
    for (let elapsed = 0; elapsed <= 1400; elapsed += 200) {
      const visibility = await actions.evaluate((el) => getComputedStyle(el).visibility);
      expect(visibility).toBe("visible");
      if (elapsed < 1400) await page.waitForTimeout(200);
    }

    const finalOpacity = await actions.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(finalOpacity).toBe(1);
  });

  test("reduced motion renders the hero CTA row fully opaque and visible immediately", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    const actions = page.locator('[data-home-stage="entry"] .actions');
    const style = await actions.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { opacity: computed.opacity, visibility: computed.visibility };
    });

    expect(style).toEqual({ opacity: "1", visibility: "visible" });
    await context.close();
  });
});

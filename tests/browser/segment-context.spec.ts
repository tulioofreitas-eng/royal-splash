import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SIGNATURE_PATH =
  "/brand/identity/signatures/royal-splash-signature-h1-gold.svg";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
}

async function expectNonDecreasingHeadingLevels(page: Page): Promise<void> {
  const levels = await page.locator("main h1, main h2, main h3, main h4, main h5, main h6").evaluateAll((headings) =>
    headings.map((heading) => Number(heading.tagName.slice(1))),
  );
  expect(levels[0]).toBe(1);
  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  }
}

const segments = [
  {
    navLinkName: "Residencial",
    route: "/servicos",
    heading: "Água integrada ao projeto de habitar.",
    intro: "Piscinas, sauna, lazer, reforma, proteção estrutural e acabamentos especializados — coordenados como parte da arquitetura residencial.",
    conversionHeading: "Compartilhe o contexto do seu projeto.",
    whatsappName: "WhatsApp para projeto Residencial",
  },
  {
    navLinkName: "Corporativo / Institucional",
    route: "/corporativo",
    heading: "Engenharia aquática para uso coletivo.",
    intro: "Escala, circulação, intensidade de uso e contexto técnico orientam cada projeto corporativo ou institucional.",
    conversionHeading: "Comece pela escala e pelo contexto de uso.",
    whatsappName: "WhatsApp para projeto Corporativo / Institucional",
  },
] as const;

for (const segment of segments) {
  test(`${segment.navLinkName} is an exact Brand consumer with preserved content and links`, async ({
    page,
  }) => {
    const brandFontRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/brand/fonts/")) brandFontRequests.push(request.url());
    });

    const response = await page.goto(segment.route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).toHaveAttribute("data-site-visual", "brand");
    await expect(page.locator("body")).toHaveClass(/site-primitive-page/);
    await expect(page.locator("[data-site-header]")).toHaveAttribute(
      "data-site-header-visual", "brand",
    );
    await expect(
      page.locator("[data-site-header]").locator(`img[src="${SIGNATURE_PATH}"]`),
    ).toBeVisible();

    const main = page.getByRole("main");
    const heading = main.getByRole("heading", {
      level: 1, name: segment.heading, exact: true,
    });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS("font-family", /Cormorant Garamond/);
    await expect(main.getByText(segment.intro, { exact: true })).toHaveCSS(
      "font-family", /Hanken Grotesk/,
    );
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(250, 249, 246)");
    await expect(page.locator("body")).toHaveCSS("color", "rgb(18, 23, 28)");

    await expect(
      main.getByRole("link", { name: "Ver Acervo", exact: true }),
    ).toHaveAttribute("href", "/projetos");

    const conversion = main.getByRole("region", {
      name: segment.conversionHeading,
    });
    await expect(conversion.getByRole("link", { name: segment.whatsappName })).toHaveAttribute(
      "href", "https://wa.me/5521982590643",
    );
    await expect(
      conversion.getByRole("link", { name: "Prepare a conversa", exact: true }),
    ).toHaveAttribute("href", "/inicie-seu-projeto");
    await expect(conversion).toHaveCSS("background-color", "rgb(18, 23, 28)");
    await expect(conversion).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(brandFontRequests.some((url) => url.includes("hanken-grotesk"))).toBe(true);
    expect(brandFontRequests.some((url) => url.includes("cormorant-garamond"))).toBe(true);
  });

  test(`${segment.navLinkName} routes its secondary action to the structured project-start form`, async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", {
      name: segment.navLinkName,
      exact: true,
    }).click();

    await expect(page).toHaveURL(
      new RegExp(`${segment.route}$`),
    );

    const main = page.getByRole("main");

    await expect(
      main.getByRole("heading", {
        level: 1,
        name: segment.heading,
        exact: true,
      }),
    ).toBeVisible();

    const conversion = main.getByRole("region", {
      name: segment.conversionHeading,
    });

    await conversion.getByRole("link", { name: "Prepare a conversa", exact: true }).click();

    await expect(page).toHaveURL(/\/inicie-seu-projeto$/);
    expect(new URL(page.url()).search).toBe("");
    await expect(page.getByRole("heading", {
      level: 1,
      name: "Organize seu contexto para uma conversa mais útil.",
      exact: true,
    })).toBeVisible();
  });

  test(`${segment.navLinkName} has responsive, keyboard, focus and accessibility integrity`, async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(segment.route);
      await expect(page.getByRole("heading", {
        level: 1, name: segment.heading, exact: true,
      })).toBeVisible();
      await expect(page.getByRole("link", { name: "Prepare a conversa", exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await expectNonDecreasingHeadingLevels(page);

    await page.keyboard.press("Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused).toBeVisible();
    expect(await focused.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    })).toBe(true);

    const accessibilityScanResults =
      await new AxeBuilder({
        page,
      }).analyze();

    expect(
      accessibilityScanResults.violations,
    ).toEqual([]);
  });
}

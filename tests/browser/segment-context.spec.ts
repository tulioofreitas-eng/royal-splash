import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SIGNATURE_PATH =
  "/brand/identity/signatures/royal-splash-signature-h1-gold.svg";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
}

const segments = [
  {
    homeLink: "Explorar Residencial",
    route: "/servicos",
    context: "residencial",
    heading: "Residencial",
    intro: "Explore o contexto residencial, consulte as evidências disponíveis e avance para o fluxo estruturado quando fizer sentido.",
    cta: "Inicie seu projeto residencial",
  },
  {
    homeLink:
      "Explorar Corporativo / Institucional",
    route: "/corporativo",
    context: "corporativo_institucional",
    heading: "Corporativo / Institucional",
    intro: "Explore o contexto corporativo ou institucional, consulte as evidências disponíveis e avance para o fluxo estruturado quando fizer sentido.",
    cta:
      "Inicie seu projeto corporativo / institucional",
  },
] as const;

for (const segment of segments) {
  test(`${segment.heading} is an exact Brand consumer with preserved content and links`, async ({
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
    await expect(page.locator(`img[src="${SIGNATURE_PATH}"]`)).toBeVisible();

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

    const qualifiedActions = main.getByRole("link", { name: segment.cta, exact: true });
    await expect(qualifiedActions).toHaveCount(2);
    for (let index = 0; index < 2; index += 1) {
      await expect(qualifiedActions.nth(index)).toHaveAttribute(
        "href", `/inicie-seu-projeto?context=${segment.context}`,
      );
      await expect(qualifiedActions.nth(index)).toHaveAttribute(
        "data-analytics-component", "segment_context",
      );
      await expect(qualifiedActions.nth(index)).toHaveAttribute(
        "data-analytics-subject", segment.context,
      );
      await expect(qualifiedActions.nth(index)).toHaveAttribute(
        "data-analytics-channel", "site_form",
      );
    }

    for (const [name, href] of [
      ["Ver Projetos", "/projetos"],
      ["Explorar Projetos", "/projetos"],
      ["Conhecer Método Royal", "/metodo-royal"],
      ["Contato e canais auxiliares", "/contato"],
    ] as const) {
      await expect(main.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }

    const conversion = main.getByRole("region", {
      name: "Avance com o contexto do seu projeto",
    });
    await expect(conversion).toHaveCSS("background-color", "rgb(18, 23, 28)");
    await expect(conversion).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(brandFontRequests.some((url) => url.includes("hanken-grotesk"))).toBe(true);
    expect(brandFontRequests.some((url) => url.includes("cormorant-garamond"))).toBe(true);
  });

  test(`${segment.heading} preserves context into qualified intake`, async ({
    page,
  }) => {
    await page.goto("/");

    const router = page.getByRole("region", {
      name: "Escolha seu contexto",
    });

    await router.getByRole("link", {
      name: segment.homeLink,
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

    const qualifiedActions =
      main.getByRole("link", {
        name: segment.cta,
        exact: true,
      });

    await expect(
      qualifiedActions,
    ).toHaveCount(2);

    const expectedHref =
      `/inicie-seu-projeto?context=${segment.context}`;

    for (let index = 0; index < 2; index += 1) {
      await expect(
        qualifiedActions.nth(index),
      ).toHaveAttribute(
        "href",
        expectedHref,
      );
    }

    await qualifiedActions.first().click();

    await expect(page).toHaveURL(
      new RegExp(
        `/inicie-seu-projeto\\?context=${segment.context}&source=segment_context&pageRef=%2F${segment.route.slice(1)}$`,
      ),
    );

    await expect(
      page.getByLabel("Contexto", {
        exact: true,
      }),
    ).toHaveValue(segment.context);
  });

  test(`${segment.heading} has responsive, keyboard, focus and accessibility integrity`, async ({
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
      await expect(page.getByRole("link", { name: segment.cta, exact: true }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    expect(await page.locator("main h1, main h2, main h3, main h4, main h5, main h6").evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1)))
    )).toEqual([1, 2, 2, 2]);

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

import { expect, test, type Page } from "@playwright/test";

const functionalRoutes: string[] = [];
const brandRoutes = [
  { route: "/", heading: "Água como parte da arquitetura.", bodySelector: '[data-home-stage="entry"] .cinematic-hero__content > p:not(.kicker)' },
  { route: "/inicie-seu-projeto", heading: "Organize seu contexto para uma conversa mais útil.", bodySelector: ".experience-entry .experience-lead" },
  { route: "/sobre", heading: "Engenharia de água para espaços que permanecem.", bodySelector: ".experience-entry .experience-lead" },
  { route: "/metodo-royal", heading: "Como a conversa se organiza em execução.", bodySelector: ".experience-entry .experience-lead" },
  { route: "/projetos", heading: "Fotografias de projetos realizados.", bodySelector: ".experience-entry .experience-lead" },
  { route: "/servicos", heading: "Água integrada ao projeto de habitar.", bodySelector: '[data-segment-context="residencial"] > p' },
  { route: "/corporativo", heading: "Engenharia aquática para uso coletivo.", bodySelector: '[data-segment-context="corporativo_institucional"] > p' },
];

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

for (const route of functionalRoutes) {
  test(`shared entrypoint remains inert on ${route}`, async ({ page }) => {
    const brandFontRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/brand/fonts/")) brandFontRequests.push(request.url());
    });

    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).toHaveAttribute("data-site-visual", "functional");
    await expect(page.locator("[data-site-header]")).toHaveAttribute(
      "data-site-header-visual", "functional",
    );

    const bodyFont = await page.locator("body").evaluate((body) => getComputedStyle(body).fontFamily);
    expect(bodyFont).not.toContain("Hanken Grotesk");
    expect(bodyFont).not.toContain("Cormorant Garamond");
    await expect(page.locator("body")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(brandFontRequests).toEqual([]);
  });
}

for (const { route, heading, bodySelector } of brandRoutes) {
  test(`${route} is an authorized Brand consumer with Brand typography`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("body")).toHaveAttribute("data-site-visual", "brand");
    await expect(page.locator("[data-site-header]")).toHaveAttribute(
      "data-site-header-visual", "brand",
    );
    await expect(page.getByRole("heading", { level: 1, name: heading })).toHaveCSS(
      "font-family", /Cormorant Garamond/,
    );
    await expect(page.locator(bodySelector).last()).toHaveCSS(
      "font-family", /Hanken Grotesk/,
    );
  });
}

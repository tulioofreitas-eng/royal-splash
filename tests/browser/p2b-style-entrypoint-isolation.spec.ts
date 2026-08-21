import { expect, test, type Page } from "@playwright/test";

const functionalRoutes = ["/", "/projetos", "/metodo-royal"];

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

test("About retains its existing Brand mode and typography", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.locator("body")).toHaveAttribute("data-site-visual", "brand");
  await expect(page.locator("[data-site-header]")).toHaveAttribute(
    "data-site-header-visual", "brand",
  );
  await expect(page.getByRole("heading", { level: 1, name: "A Royal" })).toHaveCSS(
    "font-family", /Cormorant Garamond/,
  );
  await expect(page.locator('[data-trust-stage="entry"] > p').last()).toHaveCSS(
    "font-family", /Hanken Grotesk/,
  );
});

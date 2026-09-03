import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const headerRoutes = [
  "/obrigado",
];

for (const route of headerRoutes) {
  test(`${route} shared legacy header avoids redundant logo alt text`, async ({
    page,
  }) => {
    await page.goto(route);

    const homeLink = page.locator('header a[href="/"]').first();
    const logo = homeLink.locator('img[src="/logo.png"]');

    await expect(homeLink).toBeVisible();
    await expect(logo).toHaveAttribute("alt", "");
    await expect(homeLink).toHaveAccessibleName(/Royal\s*Splash/i);

    const results = await new AxeBuilder({
      page,
    })
      .withRules([
        "image-redundant-alt",
      ])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("/politica-de-privacidade current SiteHeader avoids redundant signature alt text", async ({
  page,
}) => {
  await page.goto("/politica-de-privacidade");

  const homeLink = page.locator('header a[href="/"]').first();
  const signature = homeLink.locator("img");

  await expect(homeLink).toBeVisible();
  await expect(signature).toHaveAttribute("alt", "");
  await expect(homeLink).toHaveAccessibleName(/Royal\s*Splash/i);

  const results = await new AxeBuilder({
    page,
  })
    .withRules([
      "image-redundant-alt",
    ])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("/politica-de-privacidade inline contact links do not rely only on color", async ({
  page,
}) => {
  await page.goto("/politica-de-privacidade");

  const inlineContactLinks = page.locator(
    'main a[href^="mailto:"], main a[href^="https://wa.me/"]',
  );

  await expect(inlineContactLinks).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const link = inlineContactLinks.nth(index);

    await expect(link).toBeVisible();

    const decoration = await link.evaluate(
      (node) => getComputedStyle(node).textDecorationLine,
    );

    expect(decoration).toContain("underline");
  }

  const results = await new AxeBuilder({
    page,
  })
    .withRules([
      "link-in-text-block",
    ])
    .analyze();

  expect(results.violations).toEqual([]);
});

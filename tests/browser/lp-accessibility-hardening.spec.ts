import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Landing Page technical accessibility hardening", () => {
  test("reparo subaquatico preserves valid heading order and non-redundant image semantics", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto("/lp/reparo-subaquatico");

    const cardHeadings = page.locator(
      "h3.font-semibold.mb-1",
    );

    await expect(cardHeadings).toHaveCount(4);

    await expect(cardHeadings.nth(0)).toHaveText(
      "Hotéis e Resorts",
    );
    await expect(cardHeadings.nth(1)).toHaveText(
      "Clubes e Academias",
    );
    await expect(cardHeadings.nth(2)).toHaveText(
      "Condomínios",
    );
    await expect(cardHeadings.nth(3)).toHaveText(
      "Técnica Especializada",
    );

    const logo = page.locator(
      'img[src="/logo.png"]',
    );

    await expect(logo).toHaveAttribute("alt", "");

    const results = await new AxeBuilder({ page })
      .withRules([
        "heading-order",
        "image-redundant-alt",
      ])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});

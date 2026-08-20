import {
  expect,
  test,
} from "@playwright/test";

const previewRoutes = [
  "/",
  "/contato",
  "/corporativo",
  "/inicie-seu-projeto",
  "/lp/corporativo",
  "/lp/fibra",
  "/lp/lazer",
  "/lp/piscinas",
  "/lp/reforma",
  "/lp/sauna",
  "/lp/vazamento",
  "/metodo-royal",
  "/obrigado",
  "/politica-de-privacidade",
  "/projetos",
  "/servicos",
  "/sobre",
];

test("Preview corpus is uniformly noindex nofollow", async ({
  page,
}) => {
  for (const route of previewRoutes) {
    await page.goto(route);

    const robots =
      page.locator('meta[name="robots"]');

    await expect(
      robots,
      `${route} must expose exactly one robots directive`,
    ).toHaveCount(1);

    const content =
      (await robots.getAttribute("content")) ?? "";

    const directives = new Set(
      content
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );

    expect(
      directives.has("noindex"),
      `${route} must be noindex in Preview`,
    ).toBe(true);

    expect(
      directives.has("nofollow"),
      `${route} must be nofollow in Preview`,
    ).toBe(true);
  }
});

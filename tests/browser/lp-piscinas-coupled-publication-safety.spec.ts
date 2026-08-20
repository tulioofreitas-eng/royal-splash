import { expect, test } from "@playwright/test";

test("/lp/piscinas suppresses coupled unverified proof and technical surfaces", async ({
  page,
}) => {
  const response = await page.goto(
    "/lp/piscinas",
    {
      waitUntil: "networkidle",
    },
  );

  expect(response?.ok()).toBe(true);

  const bodyText = (
    await page.locator("body").innerText()
  )
    .replace(/\s+/g, " ")
    .trim();

  const forbiddenBody = [
    /Como construímos/i,
    /Projetos que falam por si/i,
    /piscina de 30 anos/i,
    /problema em 3/i,
    /Testada antes do acabamento/i,
    /base que não dá problema/i,
    /Cálculo de calha e recirculação incluído no projeto/i,
    /impermeabilização assinados por engenheiro/i,
  ];

  for (const pattern of forbiddenBody) {
    expect(bodyText).not.toMatch(pattern);
  }

  const alts = await page
    .locator("img")
    .evaluateAll(
      (images) =>
        images.map(
          (image) =>
            image.getAttribute("alt") ?? "",
        ),
    );

  for (const alt of alts) {
    expect(alt).not.toMatch(
      /Royal Splash/i,
    );
  }

  await expect(
    page.locator(".galeria-zoom-item"),
  ).toHaveCount(0);

  await expect(
    page.locator("#lightbox"),
  ).toHaveCount(0);

  // Material claims are owned by downstream
  // publication-safety regression coverage.
});

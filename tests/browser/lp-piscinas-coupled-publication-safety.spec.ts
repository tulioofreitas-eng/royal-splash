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
  ).toHaveCount(4);

  await expect(
    page.locator("#lightbox"),
  ).toHaveCount(1);

  // Ensure the gallery renders correctly (no huge icons or collapsed grids)
  const icons = page.locator(".piscinas-narrative__icon");
  const iconCount = await icons.count();
  expect(iconCount).toBeGreaterThan(0);
  for (let i = 0; i < iconCount; i++) {
    const box = await icons.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(32);
    expect(box!.height).toBeLessThanOrEqual(32);
  }

  const galleryItems = page.locator(".galeria-zoom-item");
  const galleryCount = await galleryItems.count();
  expect(galleryCount).toBe(4);
  for (let i = 0; i < galleryCount; i++) {
    const box = await galleryItems.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(50);
    expect(box!.height).toBeGreaterThan(50);
  }

  // Material claims are owned by downstream
  // publication-safety regression coverage.
});

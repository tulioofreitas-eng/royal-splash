import {
  expect,
  test,
} from "@playwright/test";

const route =
  "/lp/corporativo";

const cases = [
  "Piscinas olímpicas e complexos aquáticos",
  "Áreas de lazer para hotéis e resorts",
  "Manutenção expressa de piscinas",
];

const expectedSizes =
  "(min-width: 1072px) 480px, "
  + "(min-width: 768px) calc(50vw - 3.5rem), "
  + "calc(100vw - 3rem)";

test.describe(
  "Corporativo supporting image delivery",
  () => {
    for (
      const alt
      of cases
    ) {
      test(
        `${alt} uses responsive lazy delivery`,
        async ({
          page,
        }) => {
          await page.setViewportSize({
            width: 390,
            height: 844,
          });

          const response =
            await page.goto(route);

          expect(response).not.toBeNull();
          expect(response?.ok()).toBe(true);

          const image =
            page.locator(
              `img[alt="${alt}"]`,
            );

          await expect(
            image,
          ).toHaveCount(1);

          await expect(
            image,
          ).toHaveAttribute(
            "sizes",
            expectedSizes,
          );

          await expect(
            image,
          ).toHaveAttribute(
            "loading",
            "lazy",
          );

          await expect(
            image,
          ).toHaveAttribute(
            "decoding",
            "async",
          );

          await expect(
            image,
          ).not.toHaveAttribute(
            "fetchpriority",
            "high",
          );

          const srcset =
            await image.getAttribute(
              "srcset",
            );

          expect(srcset).toBeTruthy();
          expect(srcset).toContain(
            "340w",
          );
          expect(srcset).toContain(
            "480w",
          );

          const geometry =
            await image.evaluate(
              (element) => {
                const rect =
                  element
                    .getBoundingClientRect();

                return {
                  renderedWidth:
                    rect.width,

                  viewportWidth:
                    window.innerWidth,
                };
              },
            );

          expect(
            geometry.renderedWidth,
          ).toBeGreaterThanOrEqual(
            330,
          );

          expect(
            geometry.renderedWidth,
          ).toBeLessThanOrEqual(
            350,
          );
        },
      );
    }
  },
);

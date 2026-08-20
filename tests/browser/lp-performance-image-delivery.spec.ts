import {
  expect,
  test,
} from "@playwright/test";

const cases = [
  {
    route: "/lp/corporativo",
    alt: "Áreas de lazer corporativas",
  },
  {
    route: "/lp/fibra",
    alt: "Piscina de fibra de alto padrão",
  },
  {
    route: "/lp/lazer",
    alt: "Área de lazer de alto padrão",
  },
  {
    route: "/lp/piscinas",
    alt: "...",
  },
  {
    route: "/lp/reforma",
    alt: "Reforma de piscina de alto padrão",
  },
  {
    route: "/lp/sauna",
    alt: "Sauna e spa de alto padrão",
  },
  {
    route: "/lp/vazamento",
    alt: "Detecção de vazamento em piscina",
  },
];

for (
  const {
    route,
    alt,
  } of cases
) {
  test(
    `${route} prioritizes a responsive full-width hero`,
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

      const hero =
        page.locator(
          `img[alt="${alt}"]`,
        );

      await expect(hero).toHaveCount(1);

      await expect(hero).toHaveAttribute(
        "sizes",
        "100vw",
      );

      await expect(hero).toHaveAttribute(
        "loading",
        "eager",
      );

      await expect(hero).toHaveAttribute(
        "decoding",
        "sync",
      );

      await expect(hero).toHaveAttribute(
        "fetchpriority",
        "high",
      );

      const srcset =
        await hero.getAttribute(
          "srcset",
        );

      expect(srcset).toBeTruthy();

      expect(srcset).toContain(
        "390w",
      );

      expect(srcset).toContain(
        "1280w",
      );

      const geometry =
        await hero.evaluate(
          (image) => {
            const rect =
              image.getBoundingClientRect();

            return {
              renderedWidth:
                rect.width,

              viewportWidth:
                window.innerWidth,

              top:
                rect.top,

              bottom:
                rect.bottom,

              width:
                image.getAttribute(
                  "width",
                ),

              height:
                image.getAttribute(
                  "height",
                ),
            };
          },
        );

      expect(geometry.width).toBeTruthy();
      expect(geometry.height).toBeTruthy();

      expect(
        Math.abs(
          geometry.renderedWidth
          - geometry.viewportWidth,
        ),
      ).toBeLessThanOrEqual(1);

      expect(
        geometry.bottom,
      ).toBeGreaterThan(0);

      expect(
        geometry.top,
      ).toBeLessThan(844);
    },
  );
}

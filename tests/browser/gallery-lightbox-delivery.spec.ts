import {
  expect,
  test,
} from "@playwright/test";

const expectedSizes =
  "(min-width: 1072px) 427px, "
  + "(min-width: 768px) calc(44.8vw - 3.36rem), "
  + "calc(89.6vw - 3.58rem)";

const routes = [
  {
    route: "/lp/lazer",
    items: [
      "Área de lazer completa",
      "Área gourmet integrada",
      "Deck e paisagismo",
      "Área de lazer à noite",
    ],
  },
  {
    route: "/lp/sauna",
    items: [
      "Sauna residencial de alto padrão",
      "Spa e ofurô",
      "Espaço integrado de spa",
      "Detalhe do aquecedor de sauna",
    ],
  },
];

for (
  const {
    route,
    items,
  }
  of routes
) {
  test(
    `${route} uses responsive gallery thumbnails with independent full-resolution lightbox delivery`,
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

      for (
        const alt
        of items
      ) {
        const thumbnail =
          page.locator(
            `.galeria-zoom-item img[alt="${alt}"]`,
          );

        await expect(
          thumbnail,
        ).toHaveCount(1);

        await expect(
          thumbnail,
        ).toHaveAttribute(
          "loading",
          "lazy",
        );

        await expect(
          thumbnail,
        ).toHaveAttribute(
          "decoding",
          "async",
        );

        await expect(
          thumbnail,
        ).toHaveAttribute(
          "sizes",
          expectedSizes,
        );

        const srcset =
          await thumbnail.getAttribute(
            "srcset",
          );

        expect(srcset).toBeTruthy();

        for (
          const candidate
          of [
            "320w",
            "480w",
            "640w",
            "960w",
            "1280w",
          ]
        ) {
          expect(
            srcset,
          ).toContain(
            candidate,
          );
        }

        const button =
          thumbnail.locator("..");

        const lightboxSource =
          await button.getAttribute(
            "data-lightbox-src",
          );

        expect(
          lightboxSource,
        ).toBeTruthy();

        const currentThumbnailSource =
          await thumbnail.evaluate(
            (
              image,
            ) =>
              image.currentSrc,
          );

        expect(
          currentThumbnailSource,
        ).toBeTruthy();

        expect(
          new URL(
            currentThumbnailSource,
            page.url(),
          ).href,
        ).not.toBe(
          new URL(
            lightboxSource!,
            page.url(),
          ).href,
        );

        await button.click();

        const lightbox =
          page.locator(
            "#lightbox-img",
          );

        await expect(
          lightbox,
        ).toHaveAttribute(
          "src",
          lightboxSource!,
        );

        await expect(
          lightbox,
        ).toHaveAttribute(
          "alt",
          alt,
        );

        await expect.poll(
          async () =>
            lightbox.evaluate(
              (
                image,
              ) =>
                image.complete
                  ? image.naturalWidth
                  : 0,
            ),
        ).toBe(1376);

        await expect.poll(
          async () =>
            lightbox.evaluate(
              (
                image,
              ) =>
                image.complete
                  ? image.naturalHeight
                  : 0,
            ),
        ).toBe(768);

        await page.evaluate(
          () => {
            const lightbox =
              document.getElementById(
                "lightbox",
              );

            lightbox
              ?.classList
              .add(
                "hidden",
              );

            lightbox
              ?.classList
              .remove(
                "flex",
              );
          },
        );
      }
    },
  );
}

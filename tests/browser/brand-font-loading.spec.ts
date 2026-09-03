import {
  test,
  expect,
} from "@playwright/test";

const runtimeRoute =
  "/politica-de-privacidade";

const brandFonts = [
  {
    family: "Hanken Grotesk",
    weight: "400",
    url: "/brand/fonts/hanken-grotesk/HankenGrotesk-Regular.woff2",
    bytes: 31972,
  },
  {
    family: "Hanken Grotesk",
    weight: "500",
    url: "/brand/fonts/hanken-grotesk/HankenGrotesk-Medium.woff2",
    bytes: 32604,
  },
  {
    family: "Hanken Grotesk",
    weight: "600",
    url: "/brand/fonts/hanken-grotesk/HankenGrotesk-SemiBold.woff2",
    bytes: 32536,
  },
  {
    family: "Hanken Grotesk",
    weight: "700",
    url: "/brand/fonts/hanken-grotesk/HankenGrotesk-Bold.woff2",
    bytes: 33136,
  },
  {
    family: "Cormorant Garamond",
    weight: "500",
    url: "/brand/fonts/cormorant-garamond/CormorantGaramond-Medium.woff2",
    bytes: 206516,
  },
];

test(
  "approved Brand WOFF2 binaries are available from the controlled global-CSS route",
  async ({ page }) => {
    await page.goto(runtimeRoute);

    const results = await page.evaluate(
      async (fonts) => {
        const origin =
          window.location.origin;

        const output = [];

        for (const font of fonts) {
          const response =
            await fetch(
              font.url,
              {
                cache: "no-store",
              }
            );

          const bytes =
            new Uint8Array(
              await response.arrayBuffer()
            );

          output.push({
            url: font.url,
            status: response.status,
            ok: response.ok,
            sameOrigin:
              new URL(
                response.url
              ).origin === origin,
            byteLength:
              bytes.byteLength,
            magic:
              String.fromCharCode(
                ...bytes.slice(0, 4)
              ),
          });
        }

        return output;
      },
      brandFonts
    );

    expect(results).toHaveLength(5);

    for (
      let index = 0;
      index < brandFonts.length;
      index += 1
    ) {
      const expected =
        brandFonts[index];

      const actual =
        results[index];

      expect(actual.url)
        .toBe(expected.url);

      expect(actual.status)
        .toBe(200);

      expect(actual.ok)
        .toBe(true);

      expect(actual.sameOrigin)
        .toBe(true);

      expect(actual.byteLength)
        .toBe(expected.bytes);

      expect(actual.magic)
        .toBe("wOF2");
    }
  }
);

test(
  "controlled global-CSS route registers exactly the approved Brand faces without migrating legacy typography",
  async ({ page }) => {
    const brandRequests = [];

    page.on(
      "request",
      (request) => {
        const url =
          new URL(request.url());

        if (
          url.pathname.startsWith(
            "/brand/fonts/"
          ) &&
          url.pathname.endsWith(
            ".woff2"
          )
        ) {
          brandRequests.push(
            url.pathname
          );
        }
      }
    );

    await page.goto(runtimeRoute);

    const registration =
      await page.evaluate(() => {
        const root =
          getComputedStyle(
            document.documentElement
          );

        const brandFaces = [
          ...document.fonts
        ]
          .filter(
            (face) =>
              face.family ===
                "Hanken Grotesk" ||
              face.family ===
                "Cormorant Garamond"
          )
          .map(
            (face) => ({
              family:
                face.family,
              weight:
                face.weight,
              style:
                face.style,
              status:
                face.status,
            })
          )
          .sort(
            (a, b) =>
              `${a.family}:${a.weight}`
                .localeCompare(
                  `${b.family}:${b.weight}`
                )
          );

        return {
          brandFaces,

          tokens: {
            dark:
              root
                .getPropertyValue(
                  "--brand-color-royal-dark"
                )
                .trim(),

            gold:
              root
                .getPropertyValue(
                  "--brand-color-royal-gold"
                )
                .trim(),

            display:
              root
                .getPropertyValue(
                  "--brand-font-display"
                )
                .trim(),

            text:
              root
                .getPropertyValue(
                  "--brand-font-text"
                )
                .trim(),
          },

          bodyFontFamily:
            getComputedStyle(
              document.body
            ).fontFamily,
        };
      });

    expect(
      registration.tokens.dark
    ).toBe("#12171C");

    expect(
      registration.tokens.gold
    ).toBe("#D9B746");

    expect(
      registration.tokens.display
    ).toContain(
      "Cormorant Garamond"
    );

    expect(
      registration.tokens.text
    ).toContain(
      "Hanken Grotesk"
    );

    expect(
      registration.brandFaces
    ).toEqual(
      [
        {
          family:
            "Cormorant Garamond",
          weight:
            "500",
          style:
            "normal",
            status:
              "loaded",
        },
        {
          family:
            "Hanken Grotesk",
          weight:
            "400",
          style:
            "normal",
            status:
              "loaded",
        },
        {
          family:
            "Hanken Grotesk",
          weight:
            "500",
          style:
            "normal",
            status:
              "loaded",
        },
        {
          family:
            "Hanken Grotesk",
          weight:
            "600",
          style:
            "normal",
            status:
              "loaded",
        },
        {
          family:
            "Hanken Grotesk",
          weight:
            "700",
          style:
            "normal",
            status:
              "loaded",
        },
      ]
    );

    /*
     * The current Site Brand page is an authorized Brand consumer.
     */
    expect(
      registration.bodyFontFamily
    ).toMatch(
      /Hanken Grotesk/i
    );

    /*
     * The accepted Brand-mode page actively consumes the self-hosted
     * Brand faces, so the browser requests exactly the five controlled
     * files and nothing beyond the approved set.
     */
    expect(
      [...new Set(brandRequests)].sort()
    ).toEqual(
      brandFonts.map((font) => font.url).sort()
    );

    const loads =
      await page.evaluate(
        async (fonts) => {
          const output = [];

          for (const font of fonts) {
            const descriptor =
              `${font.weight} 16px "${font.family}"`;

            const faces =
              await document.fonts.load(
                descriptor,
                "Royal Splash"
              );

            output.push({
              descriptor,

              loaded: faces.map(
                (face) => ({
                  family:
                    face.family,
                  weight:
                    face.weight,
                  style:
                    face.style,
                  status:
                    face.status,
                })
              ),

              checkAfter:
                document.fonts.check(
                  descriptor,
                  "Royal Splash"
                ),
            });
          }

          return output;
        },
        brandFonts
      );

    expect(loads).toHaveLength(5);

    for (
      let index = 0;
      index < loads.length;
      index += 1
    ) {
      const actual =
        loads[index];

      const expected =
        brandFonts[index];

      expect(
        actual.loaded.length
      ).toBeGreaterThan(0);

      expect(
        actual.loaded.some(
          (face) =>
            face.family ===
              expected.family &&
            face.weight ===
              expected.weight &&
            face.style ===
              "normal" &&
            face.status ===
              "loaded"
        )
      ).toBe(true);

      expect(
        actual.checkAfter
      ).toBe(true);
    }

    await page.waitForTimeout(100);

    expect(
      [...new Set(brandRequests)]
        .sort()
    ).toEqual(
      brandFonts
        .map(
          (font) =>
            font.url
        )
        .sort()
    );
  }
);

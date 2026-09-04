import test from "node:test";
import assert from "node:assert/strict";

import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

const ROOT = process.cwd();

const BRAND_CSS = path.join(
  ROOT,
  "src/styles/brand-foundation.css"
);

const GLOBAL_CSS = path.join(
  ROOT,
  "src/styles/global.css"
);

const canonicalColors = {
  "--brand-color-royal-dark": "#12171C",
  "--brand-color-royal-gold": "#D9B746",
  "--brand-color-white": "#FFFFFF",
  "--brand-color-soft-background": "#FAF9F6",
  "--brand-color-surface": "#E7E4DD",
  "--brand-color-line": "#B8B4AA",
  "--brand-color-secondary-text": "#716D65",
};

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

test(
  "Brand foundation declares exactly the canonical palette values",
  async () => {
    const css = await readFile(
      BRAND_CSS,
      "utf8"
    );

    for (
      const [token, value]
      of Object.entries(canonicalColors)
    ) {
      assert.match(
        css,
        new RegExp(
          `${escapeRegex(token)}:\\s*${escapeRegex(value)}\\s*;`
        ),
        `${token} must equal ${value}`
      );
    }

    const hexValues = [
      ...css.matchAll(
        /#[0-9A-Fa-f]{6}\b/g
      )
    ].map(
      (match) => match[0].toUpperCase()
    );

    const allowed = new Set(
      Object.values(canonicalColors)
        .map((value) => value.toUpperCase())
    );

    for (const value of hexValues) {
      assert.ok(
        allowed.has(value),
        `unexpected Brand foundation color: ${value}`
      );
    }
  }
);

test(
  "Brand foundation defines only approved production font families and weights",
  async () => {
    const css = await readFile(
      BRAND_CSS,
      "utf8"
    );

    assert.equal(
      (css.match(/@font-face\s*{/g) ?? []).length,
      5
    );

    const hankenFaces = [
      ...css.matchAll(
        /@font-face\s*{[\s\S]*?font-family:\s*"Hanken Grotesk";[\s\S]*?font-weight:\s*(400|500|600|700);[\s\S]*?}/g
      )
    ].map(
      (match) => Number(match[1])
    ).sort(
      (a, b) => a - b
    );

    assert.deepEqual(
      hankenFaces,
      [400, 500, 600, 700]
    );

    const cormorantFaces = [
      ...css.matchAll(
        /@font-face\s*{[\s\S]*?font-family:\s*"Cormorant Garamond";[\s\S]*?font-weight:\s*(500);[\s\S]*?}/g
      )
    ];

    assert.equal(
      cormorantFaces.length,
      1
    );

    assert.doesNotMatch(
      css,
      /Poppins/i
    );
  }
);

test(
  "all Brand fonts use only pinned self-hosted WOFF2 URLs",
  async () => {
    const css = await readFile(
      BRAND_CSS,
      "utf8"
    );

    const expectedUrls = [
      "/brand/fonts/hanken-grotesk/HankenGrotesk-Regular.woff2",
      "/brand/fonts/hanken-grotesk/HankenGrotesk-Medium.woff2",
      "/brand/fonts/hanken-grotesk/HankenGrotesk-SemiBold.woff2",
      "/brand/fonts/hanken-grotesk/HankenGrotesk-Bold.woff2",
      "/brand/fonts/cormorant-garamond/CormorantGaramond-Medium.woff2",
    ];

    const urls = [
      ...css.matchAll(
        /url\("([^"]+)"\)/g
      )
    ].map(
      (match) => match[1]
    );

    assert.deepEqual(
      urls.sort(),
      expectedUrls.sort()
    );

    assert.equal(
      (css.match(
        /font-display:\s*swap\s*;/g
      ) ?? []).length,
      5
    );

    assert.doesNotMatch(
      css,
      /fonts\.googleapis\.com/i
    );

    assert.doesNotMatch(
      css,
      /fonts\.gstatic\.com/i
    );

    assert.doesNotMatch(
      css,
      /\blocal\s*\(/
    );
  }
);

test(
  "typography role tokens preserve approved Brand roles",
  async () => {
    const css = await readFile(
      BRAND_CSS,
      "utf8"
    );

    assert.match(
      css,
      /--brand-font-display:\s*"Cormorant Garamond"/
    );

    assert.match(
      css,
      /--brand-font-text:\s*"Hanken Grotesk"/
    );

    assert.match(
      css,
      /--brand-font-display-weight:\s*500\s*;/
    );

    for (const weight of [400, 500, 600, 700]) {
      assert.match(
        css,
        new RegExp(
          `--brand-font-text-weight-[a-z]+:\\s*${weight}\\s*;`
        )
      );
    }
  }
);

test(
  "accessibility guard tokens never use Gold as text on light surfaces",
  async () => {
    const css = await readFile(
      BRAND_CSS,
      "utf8"
    );

    assert.match(
      css,
      /--site-a11y-text-primary-on-light:\s*var\(--brand-color-royal-dark\)\s*;/
    );

    assert.match(
      css,
      /--site-a11y-text-secondary-on-light:\s*var\(--brand-color-secondary-text\)\s*;/
    );

    assert.doesNotMatch(
      css,
      /--site-a11y-text-[^:]*-on-light:\s*var\(--brand-color-royal-gold\)/
    );

    assert.match(
      css,
      /--site-a11y-required-ui-boundary-on-light:\s*var\(--brand-color-royal-dark\)\s*;/
    );

    assert.doesNotMatch(
      css,
      /--site-a11y-required-ui-boundary-on-light:\s*var\(--brand-color-line\)/
    );
  }
);

test(
  "legacy pre-Brand consumers remain intact while Brand foundation is imported",
  async () => {
    const css = await readFile(
      GLOBAL_CSS,
      "utf8"
    );

    assert.match(
      css,
      /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Poppins/
    );

    assert.match(
      css,
      /@import "\.\/brand-foundation\.css";/
    );

    assert.match(
      css,
      /--color-marca:\s*#0B1D2E\s*;/
    );

    assert.match(
      css,
      /--color-marca-suave:\s*#12293D\s*;/
    );

    assert.match(
      css,
      /--color-piscina:\s*#38BDF8\s*;/
    );

    assert.match(
      css,
      /--color-ouro:\s*#C9A96A\s*;/
    );

    assert.match(
      css,
      /--font-sans:\s*'Poppins',\s*sans-serif\s*;/
    );
  }
);

test(
  "final Brand foundation itself contains neither legacy piscina blue nor legacy gold",
  async () => {
    const css = await readFile(
      BRAND_CSS,
      "utf8"
    );

    assert.doesNotMatch(
      css,
      /#38BDF8/i
    );

    assert.doesNotMatch(
      css,
      /#C9A96A/i
    );

    assert.doesNotMatch(
      css,
      /#0B1D2E/i
    );

    assert.doesNotMatch(
      css,
      /#12293D/i
    );
  }
);

import assert from "node:assert/strict";
import {
  readFile,
} from "node:fs/promises";
import test from "node:test";

import {
  normalizeConversionOrigin,
  normalizeConversionPageRef,
  normalizeConversionSourceRef,
} from "../../src/conversion/origin.ts";

test(
  "conversion source accepts semantic component refs only",
  () => {
    assert.equal(
      normalizeConversionSourceRef(
        "royal_projects",
      ),
      "royal_projects",
    );

    assert.equal(
      normalizeConversionSourceRef(
        " site_header ",
      ),
      "site_header",
    );

    assert.equal(
      normalizeConversionSourceRef(
        "bad-source",
      ),
      undefined,
    );

    assert.equal(
      normalizeConversionSourceRef(
        "../projects",
      ),
      undefined,
    );
  },
);

test(
  "conversion pageRef accepts local Site paths only",
  () => {
    assert.equal(
      normalizeConversionPageRef(
        "/",
      ),
      "/",
    );

    assert.equal(
      normalizeConversionPageRef(
        "/projetos/case-one",
      ),
      "/projetos/case-one",
    );

    assert.equal(
      normalizeConversionPageRef(
        "https://example.com/projetos",
      ),
      undefined,
    );

    assert.equal(
      normalizeConversionPageRef(
        "//example.com",
      ),
      undefined,
    );

    assert.equal(
      normalizeConversionPageRef(
        "/projetos?campaign=x",
      ),
      undefined,
    );
  },
);

test(
  "conversion origin fails closed unless source and pageRef are both valid",
  () => {
    assert.deepEqual(
      normalizeConversionOrigin({
        source:
          "royal_projects",
        pageRef:
          "/projetos",
      }),
      {
        source:
          "royal_projects",
        pageRef:
          "/projetos",
      },
    );

    assert.deepEqual(
      normalizeConversionOrigin({
        source:
          "royal_projects",
        pageRef:
          "https://example.com",
      }),
      {},
    );

    assert.deepEqual(
      normalizeConversionOrigin({
        source:
          "",
        pageRef:
          "/projetos",
      }),
      {},
    );
  },
);

test(
  "conversion origin runtime remains provider and CRM independent",
  async () => {
    const helper =
      await readFile(
        new URL(
          "../../src/conversion/origin.ts",
          import.meta.url,
        ),
        "utf8",
      );

    const runtime =
      await readFile(
        new URL(
          "../../src/components/runtime/ConversionOrigin.astro",
          import.meta.url,
        ),
        "utf8",
      );

    const executable =
      `${helper}\n${runtime}`;

    assert.doesNotMatch(
      executable,
      /Supabase|Atlas|Formspree|GHL|GTM|GA4|wa\.me/i,
    );

    assert.match(
      runtime,
      /a\[data-analytics-cta\]/,
    );

    assert.match(
      runtime,
      /anchor\.dataset\s*\.analyticsComponent/,
    );

    assert.match(
      runtime,
      /\/inicie-seu-projeto/,
    );
  },
);

import assert from "node:assert/strict";
import {
  readFile,
} from "node:fs/promises";
import test from "node:test";

import {
  selectRoyalPublicCaseDetails,
} from "../../src/content/royal/case-detail.ts";

function provenance(
  id = "prov-1",
) {
  return {
    id,
    sourceKind:
      "site_repository",
    sourceRef:
      "controlled/source",
  };
}

function evidence(
  overrides = {},
) {
  return {
    schemaVersion:
      "evidence.v1",
    id:
      "evidence-1",
    kind:
      "image",
    verificationState:
      "verified",
    provenance: [
      provenance(
        "prov-evidence-1",
      ),
    ],
    ...overrides,
  };
}

function siteCase(
  overrides = {},
) {
  return {
    schemaVersion:
      "case.v1",
    id:
      "case-1",
    slug:
      "case-one",
    title:
      "Controlled Case Fixture",
    summary:
      "Fixture used only by tests.",
    serviceRefs: [],
    evidenceRefs: [
      "evidence-1",
    ],
    media: [],
    verificationState:
      "verified",
    publicationState:
      "published",
    provenance: [
      provenance(
        "prov-case-1",
      ),
    ],
    ...overrides,
  };
}

function block(
  overrides = {},
) {
  return {
    id:
      "context-1",
    kind:
      "context",
    body:
      "Controlled fixture narrative.",
    evidenceRefs: [
      "evidence-1",
    ],
    provenance: [
      provenance(
        "prov-block-1",
      ),
    ],
    ...overrides,
  };
}

function detail(
  overrides = {},
) {
  return {
    schemaVersion:
      "royal-case-detail.v1",
    caseRef:
      "case-1",
    blocks: [
      block(),
    ],
    testimonialEvidenceRefs: [],
    metricEvidenceRefs: [],
    ...overrides,
  };
}

test(
  "empty Royal detail registry exposes no details",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [],
        evidence: [],
        details: [],
      }),
      [],
    );
  },
);

test(
  "public Case without a detail record remains absent",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          evidence(),
        ],
        details: [],
      }),
      [],
    );
  },
);

test(
  "non-public Case cannot expose a detail",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase({
            publicationState:
              "approved",
          }),
        ],
        evidence: [
          evidence(),
        ],
        details: [
          detail(),
        ],
      }),
      [],
    );
  },
);

test(
  "detail without narrative blocks remains absent",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          evidence(),
        ],
        details: [
          detail({
            blocks: [],
          }),
        ],
      }),
      [],
    );
  },
);

test(
  "duplicate detail records for one Case fail closed",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          evidence(),
        ],
        details: [
          detail(),
          detail(),
        ],
      }),
      [],
    );
  },
);

test(
  "duplicate or out-of-order narrative blocks fail closed",
  () => {
    const duplicateKind =
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          evidence(),
        ],
        details: [
          detail({
            blocks: [
              block(),
              block({
                id:
                  "context-2",
              }),
            ],
          }),
        ],
      });

    assert.deepEqual(
      duplicateKind,
      [],
    );

    const reversedOrder =
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          evidence(),
        ],
        details: [
          detail({
            blocks: [
              block({
                id:
                  "solution-1",
                kind:
                  "solution",
              }),
              block({
                id:
                  "challenge-1",
                kind:
                  "challenge",
              }),
            ],
          }),
        ],
      });

    assert.deepEqual(
      reversedOrder,
      [],
    );
  },
);

test(
  "narrative blocks require controlled provenance",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          evidence(),
        ],
        details: [
          detail({
            blocks: [
              block({
                provenance: [],
              }),
            ],
          }),
        ],
      }),
      [],
    );
  },
);

test(
  "narrative Evidence must belong to the Case and be verified",
  () => {
    const unverified =
      evidence({
        verificationState:
          "unverified",
      });

    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase(),
        ],
        evidence: [
          unverified,
        ],
        details: [
          detail(),
        ],
      }),
      [],
    );

    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase({
            evidenceRefs: [
              "evidence-1",
            ],
          }),
        ],
        evidence: [
          evidence(),
          evidence({
            id:
              "evidence-2",
          }),
        ],
        details: [
          detail({
            blocks: [
              block({
                evidenceRefs: [
                  "evidence-2",
                ],
              }),
            ],
          }),
        ],
      }),
      [],
    );
  },
);

test(
  "testimonial and metric refs require matching verified Evidence kinds",
  () => {
    assert.deepEqual(
      selectRoyalPublicCaseDetails({
        cases: [
          siteCase({
            evidenceRefs: [
              "evidence-1",
              "testimonial-1",
              "metric-1",
            ],
          }),
        ],
        evidence: [
          evidence(),
          evidence({
            id:
              "testimonial-1",
            kind:
              "image",
          }),
          evidence({
            id:
              "metric-1",
            kind:
              "image",
          }),
        ],
        details: [
          detail({
            testimonialEvidenceRefs: [
              "testimonial-1",
            ],
            metricEvidenceRefs: [
              "metric-1",
            ],
          }),
        ],
      }),
      [],
    );
  },
);

test(
  "valid controlled Case Detail is exposed with verified Evidence",
  () => {
    const controlledCase =
      siteCase({
        evidenceRefs: [
          "evidence-1",
          "testimonial-1",
          "metric-1",
        ],
      });

    const result =
      selectRoyalPublicCaseDetails({
        cases: [
          controlledCase,
        ],
        evidence: [
          evidence(),
          evidence({
            id:
              "testimonial-1",
            kind:
              "testimonial",
          }),
          evidence({
            id:
              "metric-1",
            kind:
              "metric",
          }),
        ],
        details: [
          detail({
            testimonialEvidenceRefs: [
              "testimonial-1",
            ],
            metricEvidenceRefs: [
              "metric-1",
            ],
          }),
        ],
      });

    assert.equal(
      result.length,
      1,
    );

    assert.equal(
      result[0].siteCase.id,
      "case-1",
    );

    assert.equal(
      result[0].evidence.length,
      3,
    );
  },
);

test(
  "Case Detail renderer and route preserve provider neutrality and fail-closed publication",
  async () => {
    const component =
      await readFile(
        new URL(
          "../../src/components/site/RoyalCaseDetail.astro",
          import.meta.url,
        ),
        "utf8",
      );

    const route =
      await readFile(
        new URL(
          "../../src/pages/projetos/[slug].astro",
          import.meta.url,
        ),
        "utf8",
      );

    const executable =
      `${component}\n${route}`;

    assert.match(
      component,
      /data-case-detail-stage/,
    );

    assert.match(
      component,
      /royal_case_detail/,
    );

    assert.match(
      route,
      /getStaticPaths/,
    );

    assert.match(
      route,
      /selectRoyalPublicCaseDetails/,
    );

    assert.doesNotMatch(
      executable,
      /global\.css|GTMHead|GTMBody|BotaoWhatsapp|GoogleReviews|wa\.me|astro:assets|bg-marca|text-piscina|obra-[0-9]/i,
    );
  },
);

test(
  "WP2 Case Detail is Brand-capable, non-public, and content-dormant",
  async () => {
    const [
      component,
      route,
      primitives,
      casesSource,
      detailsSource,
    ] =
      await Promise.all([
        readFile(
          new URL(
            "../../src/components/site/RoyalCaseDetail.astro",
            import.meta.url,
          ),
          "utf8",
        ),
        readFile(
          new URL(
            "../../src/pages/projetos/[slug].astro",
            import.meta.url,
          ),
          "utf8",
        ),
        readFile(
          new URL(
            "../../src/styles/site-primitives.css",
            import.meta.url,
          ),
          "utf8",
        ),
        readFile(
          new URL(
            "../../src/content/royal/cases.ts",
            import.meta.url,
          ),
          "utf8",
        ),
        readFile(
          new URL(
            "../../src/content/royal/case-details.ts",
            import.meta.url,
          ),
          "utf8",
        ),
      ]);

    assert.match(
      route,
      /bodyClass=["'][^"']*site-brand-case-detail[^"']*site-primitive-page[^"']*["']/,
    );
    assert.match(
      route,
      /<SiteLayout[\s\S]*?visualMode=["']brand["']/,
    );
    assert.match(
      route,
      /<SiteHeader[\s\S]*?visualMode=["']brand["']/,
    );

    assert.match(
      route,
      /getStaticPaths/,
    );
    assert.match(
      route,
      /selectRoyalPublicCaseDetails/,
    );

    assert.match(
      casesSource,
      /royalCases:\s*readonly SiteCase\[\]\s*=\s*\[\];/,
    );
    assert.match(
      casesSource,
      /royalEvidence:\s*readonly Evidence\[\]\s*=\s*\[\];/,
    );
    assert.match(
      detailsSource,
      /readonly RoyalCaseDetailRecord\[\]\s*=\s*\[\];/,
    );

    for (const primitive of [
      "site-primitive-section",
      "site-primitive-section--entry",
      "site-primitive-page-title",
      "site-primitive-section-title",
      "site-primitive-subtitle",
      "site-primitive-body",
      "site-primitive-supporting",
      "site-primitive-eyebrow",
      "site-primitive-reading",
      "site-primitive-actions",
      "site-primitive-datum-top",
      "site-primitive-surface--dark",
      "site-primitive-action",
      "site-primitive-action--primary",
      "site-primitive-action--tertiary",
    ]) {
      assert.ok(
        component.includes(primitive),
        `missing approved primitive: ${primitive}`,
      );
      assert.ok(
        primitives.includes(`.${primitive}`),
        `primitive is not defined by P2B: ${primitive}`,
      );
    }

    assert.match(
      component,
      /detail\.blocks\.map/,
    );
    assert.match(
      component,
      /supportingEvidence\.length\s*>\s*0\s*&&/,
    );
    assert.match(
      component,
      /testimonials\.length\s*>\s*0\s*&&/,
    );
    assert.match(
      component,
      /metrics\.length\s*>\s*0\s*&&/,
    );

    assert.doesNotMatch(
      component,
      /não possuem apresentação textual adicional/i,
    );

    for (const href of [
      "/projetos",
      "/inicie-seu-projeto",
      "/contato",
    ]) {
      assert.match(
        component,
        new RegExp(`href=["']${href}["']`),
      );
    }

    for (const analytics of [
      'data-analytics-cta',
      'data-analytics-component="royal_case_detail"',
      'data-analytics-subject="project_start"',
      'data-analytics-channel="site_form"',
    ]) {
      assert.ok(
        component.includes(analytics),
        `missing controlled analytics: ${analytics}`,
      );
    }

    assert.doesNotMatch(
      component,
      /<style\s+is:global/,
    );
    assert.doesNotMatch(
      component,
      /import\s+["'][^"']*(?:global|brand-foundation|site-brand|site-primitives|site-system)\.css["']/,
    );
    assert.doesNotMatch(
      component,
      /<img\b|astro:assets|Image\s+from/i,
    );
    assert.doesNotMatch(
      component,
      /#[0-9a-f]{3,8}\b/i,
    );
    assert.doesNotMatch(
      component,
      /--brand-(?:color|font)-/,
    );

    for (const forbidden of [
      "Poppins",
      "--color-marca",
      "--color-marca-suave",
      "--color-piscina",
      "--color-ouro",
      "--font-sans",
      "system-ui",
      "Canvas",
      "CanvasText",
      "Controlled Case Fixture",
      "Fixture used only by tests.",
      "Controlled fixture narrative.",
    ]) {
      assert.ok(
        !`${component}\n${route}`.includes(forbidden),
        `forbidden production Case Detail content/dependency: ${forbidden}`,
      );
    }
  },
);

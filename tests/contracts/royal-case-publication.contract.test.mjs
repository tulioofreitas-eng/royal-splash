import assert from "node:assert/strict";
import test from "node:test";

import {
  selectRoyalPublicCases,
} from "../../src/content/royal/publication.ts";

function provenance(id = "prov-1") {
  return {
    id,
    sourceKind: "site_repository",
    sourceRef: "controlled/source",
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: "evidence.v1",
    id: "evidence-1",
    kind: "image",
    verificationState: "verified",
    provenance: [
      provenance(
        "prov-evidence-1",
      ),
    ],
    ...overrides,
  };
}

function siteCase(overrides = {}) {
  return {
    schemaVersion: "case.v1",
    id: "case-1",
    slug: "case-one",
    title: "Controlled Case Fixture",
    summary:
      "Fixture used only to verify publication policy.",
    serviceRefs: [],
    evidenceRefs: [
      "evidence-1",
    ],
    media: [],
    verificationState: "verified",
    publicationState: "published",
    provenance: [
      provenance(
        "prov-case-1",
      ),
    ],
    ...overrides,
  };
}

test(
  "empty Royal catalog exposes no public cases",
  () => {
    assert.deepEqual(
      selectRoyalPublicCases({
        cases: [],
        evidence: [],
      }),
      [],
    );
  },
);

test(
  "draft review and approved cases remain private",
  () => {
    const cases = [
      siteCase({
        id: "case-draft",
        slug: "case-draft",
        publicationState: "draft",
      }),
      siteCase({
        id: "case-review",
        slug: "case-review",
        publicationState: "review",
      }),
      siteCase({
        id: "case-approved",
        slug: "case-approved",
        publicationState: "approved",
      }),
    ];

    assert.deepEqual(
      selectRoyalPublicCases({
        cases,
        evidence: [
          evidence(),
        ],
      }),
      [],
    );
  },
);

test(
  "published but non-verified cases remain private",
  () => {
    const cases = [
      siteCase({
        id: "case-unverified",
        slug: "case-unverified",
        verificationState:
          "unverified",
      }),
      siteCase({
        id: "case-partial",
        slug: "case-partial",
        verificationState:
          "partially_verified",
      }),
    ];

    assert.deepEqual(
      selectRoyalPublicCases({
        cases,
        evidence: [
          evidence(),
        ],
      }),
      [],
    );
  },
);

test(
  "published verified case without evidence remains private",
  () => {
    const cases = [
      siteCase({
        evidenceRefs: [],
      }),
    ];

    assert.deepEqual(
      selectRoyalPublicCases({
        cases,
        evidence: [],
      }),
      [],
    );
  },
);

test(
  "unverified or missing referenced evidence keeps case private",
  () => {
    const cases = [
      siteCase(),
    ];

    assert.deepEqual(
      selectRoyalPublicCases({
        cases,
        evidence: [
          evidence({
            verificationState:
              "unverified",
          }),
        ],
      }),
      [],
    );

    assert.deepEqual(
      selectRoyalPublicCases({
        cases,
        evidence: [],
      }),
      [],
    );
  },
);

test(
  "only published verified case with verified evidence is exposed",
  () => {
    const controlled =
      siteCase();

    assert.deepEqual(
      selectRoyalPublicCases({
        cases: [
          controlled,
        ],
        evidence: [
          evidence(),
        ],
      }),
      [
        controlled,
      ],
    );
  },
);

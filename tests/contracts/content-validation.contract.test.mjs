import assert from "node:assert/strict";
import test from "node:test";

import {
  validateCaseContent,
} from "../../src/validation/cases.ts";

function provenance(id = "prov-1") {
  return {
    id,
    sourceKind: "site_repository",
    sourceRef: "content/source",
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: "evidence.v1",
    id: "evidence-1",
    kind: "image",
    verificationState: "verified",
    provenance: [provenance("prov-evidence-1")],
    ...overrides,
  };
}

function siteCase(overrides = {}) {
  return {
    schemaVersion: "case.v1",
    id: "case-1",
    slug: "case-one",
    title: "Case One",
    summary: "Summary",
    serviceRefs: [],
    evidenceRefs: ["evidence-1"],
    media: [],
    verificationState: "verified",
    publicationState: "approved",
    provenance: [provenance("prov-case-1")],
    ...overrides,
  };
}

function issueCodes(result) {
  return result.issues.map((issue) => issue.code);
}

test("valid Case/Evidence content passes deterministic validation", () => {
  const result = validateCaseContent({
    cases: [siteCase()],
    evidence: [evidence()],
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("required identifiers and provenance references must be non-empty", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        id: " ",
        provenance: [
          {
            id: "",
            sourceKind: "site_repository",
            sourceRef: " ",
          },
        ],
      }),
    ],
    evidence: [
      evidence({
        id: "",
        provenance: [],
      }),
    ],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("required_identifier"));
  assert.ok(issueCodes(result).includes("missing_provenance"));
});

test("case slug must use lowercase kebab-case", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        slug: "Case One",
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("invalid_slug"));
});

test("duplicate case ids, case slugs and evidence ids are rejected", () => {
  const result = validateCaseContent({
    cases: [
      siteCase(),
      siteCase({
        publicationState: "approved",
      }),
    ],
    evidence: [
      evidence(),
      evidence({
        verificationState: "verified",
      }),
    ],
  });

  assert.equal(result.valid, false);

  assert.ok(
    result.issues.filter(
      (issue) => issue.code === "duplicate_identifier",
    ).length >= 3,
  );
});

test("duplicate media ids inside one case are rejected", () => {
  const media = {
    schemaVersion: "case-media.v1",
    id: "media-1",
    kind: "image",
    resourceRef: "/image.jpg",
  };

  const result = validateCaseContent({
    cases: [
      siteCase({
        media: [media, { ...media }],
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("duplicate_identifier"));
});

test("duplicate provenance ids inside one provenance collection are rejected", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        provenance: [
          provenance("prov-duplicate"),
          provenance("prov-duplicate"),
        ],
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("duplicate_identifier"));
});

test("case evidenceRefs must point to existing evidence", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        evidenceRefs: ["missing-evidence"],
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("invalid_cross_reference"));
});

test("case media evidenceRef must point to existing evidence", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        media: [
          {
            schemaVersion: "case-media.v1",
            id: "media-1",
            kind: "image",
            resourceRef: "/image.jpg",
            evidenceRef: "missing-evidence",
          },
        ],
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("invalid_cross_reference"));
});

test("serviceRefs are validated only against an explicitly supplied registry", () => {
  const withoutRegistry = validateCaseContent({
    cases: [
      siteCase({
        serviceRefs: ["service-pools"],
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(withoutRegistry.valid, true);

  const withRegistry = validateCaseContent({
    cases: [
      siteCase({
        serviceRefs: ["service-pools", "service-missing"],
      }),
    ],
    evidence: [evidence()],
    knownServiceRefs: ["service-pools"],
  });

  assert.equal(withRegistry.valid, false);
  assert.ok(issueCodes(withRegistry).includes("invalid_cross_reference"));
});

test("duplicate case records with different publication states surface a publication conflict", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        publicationState: "approved",
      }),
      siteCase({
        publicationState: "published",
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("publication_conflict"));
});

test("duplicate case records with different verification states surface a verification conflict", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        verificationState: "partially_verified",
      }),
      siteCase({
        verificationState: "verified",
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("verification_conflict"));
});

test("duplicate evidence records with different verification states surface a verification conflict", () => {
  const result = validateCaseContent({
    cases: [siteCase()],
    evidence: [
      evidence({
        verificationState: "unverified",
      }),
      evidence({
        verificationState: "verified",
      }),
    ],
  });

  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes("verification_conflict"));
});

test("publication and verification remain independent dimensions", () => {
  const result = validateCaseContent({
    cases: [
      siteCase({
        publicationState: "published",
        verificationState: "unverified",
      }),
    ],
    evidence: [evidence()],
  });

  assert.equal(result.valid, true);
  assert.equal(
    issueCodes(result).includes("publication_conflict"),
    false,
  );
  assert.equal(
    issueCodes(result).includes("verification_conflict"),
    false,
  );
});

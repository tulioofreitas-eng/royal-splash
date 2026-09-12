import assert from "node:assert/strict";
import test from "node:test";

import {
  AtlasPayloadValidationError,
  mapSiteLeadToAtlasPayload,
} from "../../src/integrations/leads/atlas-site-origin-payload.ts";
import { normalizeSiteLeadRequest } from "../../src/integrations/leads/normalize-site-lead-request.ts";
import { ROYAL_PRIVACY_R1 } from "../../src/domains/leads/contracts.ts";

const NOW = new Date("2026-09-02T15:00:00.000Z");

// Regression guard: canonical Atlas service registry codes
// These are the ONLY valid codes Royal can send to Atlas intake ingress.
// If you modify these, Atlas will reject with UNKNOWN_SERVICE.
// See: sistema-mtm/supabase/migrations/0117_intake_foundation.sql
const ATLAS_CANONICAL_SERVICES = {
  reforma_alvenaria: true,
  construcao: true,
  revitalizacao_fibra: true,
};

function createLead(overrides = {}) {
  return {
    schemaVersion: "site-lead.v1",
    submissionRef: "site.12345678-1234-4123-8123-123456789abc",
    contact: {
      name: "Pessoa Teste",
      email: "pessoa@example.com",
      phone: "+55 (21) 99999-0000",
    },
    city: "Rio de Janeiro",
    interest: {
      serviceRef: "royal-internal-service",
      description: "Contexto: Residencial. Necessidade: Reforma.",
    },
    message: "Preferência por contato à tarde.",
    acquisition: {
      ingressChannel: "site_form",
      source: "royal_projects",
      campaignRef: "campaign-private",
      pageRef: "/inicie-seu-projeto",
    },
    attribution: {
      firstTouch: {
        campaignRef: "growth.launch-01",
        medium: "paid_search",
        source: "google",
        landingPageRef: "/lp/piscinas",
        referrerHost: "www.google.com",
        capturedAt: "2026-09-01T15:00:00.000Z",
      },
      submissionTouch: {
        campaignRef: "growth.submit-02",
        medium: "organic_social",
        source: "instagram",
        pageRef: "/inicie-seu-projeto",
      },
    },
    consent: {
      state: "granted",
      policyRef: ROYAL_PRIVACY_R1,
      capturedAt: "2026-09-02T14:59:30.000Z",
    },
    ...overrides,
  };
}

test("maps valid Royal ingress to the closed Atlas v1 payload", () => {
  const payload = mapSiteLeadToAtlasPayload(createLead(), NOW);

  assert.deepEqual(payload, {
    schemaVersion: "atlas-site-intake.v1",
    submission: {
      ref: "site.12345678-1234-4123-8123-123456789abc",
      channel: "site_form",
      pageRef: "/inicie-seu-projeto",
    },
    contact: {
      name: "Pessoa Teste",
      email: "pessoa@example.com",
      phone: "+55 (21) 99999-0000",
    },
    location: {
      city: "Rio de Janeiro",
    },
    request: {
      serviceRefs: ["royal-internal-service"],
      description:
        "Contexto: Residencial. Necessidade: Reforma.\n" +
        "Mensagem: Preferência por contato à tarde.",
    },
    consent: {
      state: "granted",
      policyRef: ROYAL_PRIVACY_R1,
      capturedAt: "2026-09-02T14:59:30.000Z",
    },
    attribution: {
      firstTouch: {
        campaignRef: "growth.launch-01",
        medium: "paid_search",
        source: "google",
        landingPageRef: "/lp/piscinas",
        referrerHost: "www.google.com",
        capturedAt: "2026-09-01T15:00:00.000Z",
      },
      submissionTouch: {
        campaignRef: "growth.submit-02",
        medium: "organic_social",
        source: "instagram",
        pageRef: "/inicie-seu-projeto",
      },
    },
  });
});

test("emits no Royal-only or closed-schema forbidden fields", () => {
  const payload = mapSiteLeadToAtlasPayload(createLead(), NOW);
  const serialized = JSON.stringify(payload);

  for (const forbiddenKey of [
    "message",
    "ingressChannel",
    "serviceRef",
    "empresaId",
    "tenantId",
  ]) {
    assert.equal(
      Object.hasOwn(payload, forbiddenKey),
      false,
      forbiddenKey,
    );
    assert.equal(serialized.includes(`\"${forbiddenKey}\"`), false);
  }

  assert.equal(payload.submission.source, undefined);
  assert.equal(payload.submission.campaignRef, undefined);
  assert.equal(serialized.includes("royal_projects"), false);
  assert.equal(serialized.includes("campaign-private"), false);
});

test("maps cidade to location.city without contaminating request.description", () => {
  const payload = mapSiteLeadToAtlasPayload(createLead(), NOW);

  assert.deepEqual(payload.location, { city: "Rio de Janeiro" });
  assert.equal(payload.request.description.includes("Cidade:"), false);
});

test("refuses not_recorded consent locally without coercion", () => {
  assert.throws(
    () =>
      mapSiteLeadToAtlasPayload(
        createLead({
          consent: {
            state: "not_recorded",
            policyRef: ROYAL_PRIVACY_R1,
            capturedAt: "2026-09-02T14:59:30.000Z",
          },
        }),
        NOW,
      ),
    (error) => {
      assert.equal(error instanceof AtlasPayloadValidationError, true);
      assert.equal(error.reason, "invalid_consent");
      return true;
    },
  );
});

test("refuses stale consent locally", () => {
  assert.throws(
    () =>
      mapSiteLeadToAtlasPayload(
        createLead({
          consent: {
            state: "granted",
            policyRef: ROYAL_PRIVACY_R1,
            capturedAt: "2026-09-02T14:30:00.000Z",
          },
        }),
        NOW,
      ),
    (error) => {
      assert.equal(error instanceof AtlasPayloadValidationError, true);
      assert.equal(error.reason, "stale_consent");
      return true;
    },
  );
});

for (const [label, overrides, reason] of [
  ["email", { contact: { name: "Pessoa", email: "invalid" } }, "invalid_email"],
  ["phone", { contact: { name: "Pessoa", phone: "123<script>" } }, "invalid_phone"],
  ["request", { city: undefined, interest: undefined, message: undefined }, "missing_request"],
  ["location", { city: "x".repeat(121) }, "invalid_location"],
  [
    "attribution",
    {
      attribution: {
        submissionTouch: {
          medium: "cpc",
          pageRef: "/inicie-seu-projeto",
        },
      },
    },
    "invalid_attribution",
  ],
]) {
  test(`rejects deterministic invalid ${label} input`, () => {
    assert.throws(
      () => mapSiteLeadToAtlasPayload(createLead(overrides), NOW),
      (error) => {
        assert.equal(error instanceof AtlasPayloadValidationError, true);
        assert.equal(error.reason, reason);
        return true;
      },
    );
  });
}

for (const [pageRef, expectedCanonicalCode] of [
  ["/lp/reforma-rj", "reforma_alvenaria"],
  ["/lp/piscinas-rj", "construcao"],
  ["/lp/fibra-rj", "revitalizacao_fibra"],
]) {
  test(`normalizer and mapper produce canonical code "${expectedCanonicalCode}" for ${pageRef}`, () => {
    const rawRequest = {
      submissionRef: "site.12345678-1234-4123-8123-123456789abc",
      consentCapturedAt: "2026-09-02T14:59:30.000Z",
      projectContext: "residencial",
      projectNeed: "Reforma necessária.",
      city: "Rio de Janeiro",
      name: "Pessoa Teste",
      email: "pessoa@example.com",
      phone: "+55 (21) 99999-0000",
      message: "Preferência por contato à tarde.",
      consent: true,
      source: "google",
      pageRef,
      attribution: {
        firstTouch: {
          campaignRef: "growth.launch-01",
          medium: "paid_search",
          source: "google",
          landingPageRef: pageRef,
          referrerHost: "www.google.com",
          capturedAt: "2026-09-01T15:00:00.000Z",
        },
        submissionTouch: {
          campaignRef: "growth.submit-02",
          medium: "organic_social",
          source: "instagram",
          pageRef: "/inicie-seu-projeto",
        },
      },
    };

    const normalized = normalizeSiteLeadRequest(rawRequest);
    assert.equal(
      normalized.interest.serviceRef,
      expectedCanonicalCode,
      `normalizer must map ${pageRef} to ${expectedCanonicalCode}`
    );

    const atlasPayload = mapSiteLeadToAtlasPayload(normalized, NOW);
    assert.deepEqual(
      atlasPayload.request.serviceRefs,
      [expectedCanonicalCode],
      `Atlas payload must contain exactly [${expectedCanonicalCode}] for ${pageRef}`
    );

    assert.ok(
      ATLAS_CANONICAL_SERVICES[expectedCanonicalCode],
      `${expectedCanonicalCode} must be registered in ATLAS_CANONICAL_SERVICES`
    );
  });
}

test("accepts optional projectNeed when serviceRef is present", () => {
  const lead = createLead({
    interest: {
      serviceRef: "fiberglass_pool_restoration",
      description: "Contexto: Residencial",
    },
  });
  const payload = mapSiteLeadToAtlasPayload(lead, NOW);

  assert.equal(payload.request.serviceRefs[0], "fiberglass_pool_restoration");
  assert.equal(payload.request.description.includes("Contexto: Residencial"), true);
});

// Regression guard: mutation-sensitivity for normalized service mappings
test("mutation guard: Atlas payload serviceRefs must be independently verified against canonical registry", () => {
  const testCases = [
    {
      pageRef: "/lp/reforma-rj",
      expectedCanonical: "reforma_alvenaria",
    },
    {
      pageRef: "/lp/piscinas-rj",
      expectedCanonical: "construcao",
    },
    {
      pageRef: "/lp/fibra-rj",
      expectedCanonical: "revitalizacao_fibra",
    },
  ];

  for (const { pageRef, expectedCanonical } of testCases) {
    const rawRequest = {
      submissionRef: "site.mutation-guard-12345678-1234-4123-8123",
      consentCapturedAt: "2026-09-02T14:59:30.000Z",
      projectContext: "residencial",
      projectNeed: "Test mutation sensitivity.",
      city: "Rio de Janeiro",
      name: "Teste Mutação",
      email: "mutacao@example.com",
      consent: true,
      pageRef,
      attribution: {
        submissionTouch: {
          medium: "direct",
          pageRef,
        },
      },
    };

    const normalized = normalizeSiteLeadRequest(rawRequest);
    const atlasPayload = mapSiteLeadToAtlasPayload(normalized, NOW);

    assert.ok(
      atlasPayload.request.serviceRefs && atlasPayload.request.serviceRefs.length > 0,
      `${pageRef}: Atlas payload must have serviceRefs`
    );

    const emittedRef = atlasPayload.request.serviceRefs[0];

    assert.equal(
      emittedRef,
      expectedCanonical,
      `${pageRef}: emitted serviceRef "${emittedRef}" must equal expected "${expectedCanonical}"`
    );

    assert.ok(
      ATLAS_CANONICAL_SERVICES[emittedRef],
      `${pageRef}: emitted serviceRef "${emittedRef}" must be in ATLAS_CANONICAL_SERVICES registry`
    );
  }
});

// Regression guard: canonical Atlas service registry codes
test("regression guard: Atlas canonical service codes are defined", () => {
  assert.deepEqual(Object.keys(ATLAS_CANONICAL_SERVICES).sort(), [
    "construcao",
    "reforma_alvenaria",
    "revitalizacao_fibra",
  ]);

  // Verify each code is a valid identifier
  for (const [code] of Object.entries(ATLAS_CANONICAL_SERVICES)) {
    assert.match(code, /^[a-z][a-z0-9_]*$/, `Code "${code}" must match Atlas format`);
  }
});

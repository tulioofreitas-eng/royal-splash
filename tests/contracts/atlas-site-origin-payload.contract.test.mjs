import assert from "node:assert/strict";
import test from "node:test";

import {
  AtlasPayloadValidationError,
  mapSiteLeadToAtlasPayload,
} from "../../src/integrations/leads/atlas-site-origin-payload.ts";
import { ROYAL_PRIVACY_R1 } from "../../src/domains/leads/contracts.ts";

const NOW = new Date("2026-09-02T15:00:00.000Z");

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
    request: {
      description:
        "Contexto: Residencial. Necessidade: Reforma.\n" +
        "Mensagem: Preferência por contato à tarde.\n" +
        "Cidade: Rio de Janeiro",
    },
    consent: {
      state: "granted",
      policyRef: ROYAL_PRIVACY_R1,
      capturedAt: "2026-09-02T14:59:30.000Z",
    },
  });
});

test("emits no Royal-only or closed-schema forbidden fields", () => {
  const payload = mapSiteLeadToAtlasPayload(createLead(), NOW);
  const serialized = JSON.stringify(payload);

  for (const forbiddenKey of [
    "source",
    "campaignRef",
    "message",
    "ingressChannel",
    "serviceRefs",
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

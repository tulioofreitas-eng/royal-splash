import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  normalizeSiteLeadRequest,
} from "../../src/integrations/leads/normalize-site-lead-request.ts";

test("browser-composed submissionRef survives Royal normalization byte-for-byte", () => {
  const submissionRef = "site.12345678-1234-4123-8123-123456789abc";
  const lead = normalizeSiteLeadRequest({
    submissionRef,
    consentCapturedAt: new Date().toISOString(),
    projectContext: "residencial",
    projectNeed: "Reforma completa",
    city: "Rio de Janeiro",
    name: "Pessoa Teste",
    email: "pessoa@example.com",
    consent: true,
  });

  assert.equal(lead.submissionRef, submissionRef);
});

test("StructuredIntake composes one UUID and reuses the cached logical payload", async () => {
  const source = await readFile(
    "src/components/site/StructuredIntake.astro",
    "utf8",
  );

  assert.match(source, /let composedPayload:/);
  assert.match(source, /if \(!composedPayload\)/);
  assert.match(source, /submissionRef: crypto\.randomUUID\(\)/);
  assert.match(source, /consentCapturedAt:\s*new Date\(\)\.toISOString\(\)/);
  assert.ok(
    source.indexOf("if (!composedPayload)") <
      source.indexOf("submissionRef: crypto.randomUUID()"),
  );
  assert.match(source, /body: JSON\.stringify\(payload\)/);
  assert.match(source, /action="\/api\/site-lead-preview"/);
  assert.doesNotMatch(source, /["']\/api\/site-lead["']/);
});

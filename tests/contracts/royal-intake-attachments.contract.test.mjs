import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const forms = [
  "src/components/lp/ReformaRJStructuredIntakeForm.astro",
  "src/components/lp/PiscinasRJStructuredIntakeForm.astro",
  "src/components/lp/FibraRJStructuredIntakeForm.astro",
  "src/components/lp/VazamentoRJStructuredIntakeForm.astro",
];

test("all RJ structured intakes expose optional attachments and shared conversion hardening", () => {
  for (const path of forms) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /data-attachment-input/);
    assert.match(source, /setupIntakeAttachmentField/);
    assert.match(source, /emitIntakeCreatedOnce/);
    assert.match(source, /normalizedReceipt\.replay !== true/);
    assert.match(source, /has_attachments: hasAttachments/);
    assert.match(source, /attachments\.upload/);
  }
});

test("legacy local intake conversion emitters were removed", () => {
  for (const path of forms.slice(0, 2)) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /getConversionEmittedKey/);
    assert.doesNotMatch(source, /emitIntakeCreatedEvent/);
  }
});

test("attachment client uses the complete Atlas lifecycle and carries no privileged credentials", () => {
  const source = readFileSync("src/growth/intake-attachments.ts", "utf8");
  for (const step of ["session", "authorize", "upload", "confirm", "finalize", "associate", "bind"]) {
    assert.match(source, new RegExp(`/api/site-lead/attachments/${step}`));
  }
  assert.doesNotMatch(source, /ATLAS_INGRESS_TOKEN|ATLAS_SITE_ORIGIN_URL|ATLAS_STORAGE_URL/);
});

test("Royal attachment policy is bounded and intentionally image/PDF only", () => {
  const source = readFileSync("src/domain/attachments/policy.ts", "utf8");
  assert.match(source, /MAX_ATTACHMENT_COUNT: 10/);
  assert.match(source, /50 \* 1024 \* 1024/);
  assert.match(source, /200 \* 1024 \* 1024/);
  assert.match(source, /"pdf", "jpg", "jpeg", "png", "webp"/);
  assert.doesNotMatch(source, /dwg|dxf|zip|docx|xlsx/);
});

test("attachment routes preserve Royal production-only Atlas safety", () => {
  const source = readFileSync("src/pages/api/site-lead/attachments/utils.ts", "utf8");
  assert.match(source, /getCurrentEnvironmentContract/);
  assert.match(source, /runtime\.isProduction/);
  assert.match(source, /production_only/);
});

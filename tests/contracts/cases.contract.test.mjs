import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CASE_MEDIA_KINDS,
  CASE_PUBLICATION_STATES,
  CASE_VERIFICATION_STATES,
  EVIDENCE_KINDS,
  EVIDENCE_VERIFICATION_STATES,
  PROVENANCE_SOURCE_KINDS,
} from "../../src/domains/cases/index.ts";

test("provenance source vocabulary keeps institutional and external origins explicit", () => {
  assert.deepEqual([...PROVENANCE_SOURCE_KINDS], [
    "foundation_record",
    "brand_system",
    "brand_activation_package",
    "site_repository",
    "client_supplied",
    "external_source",
    "human_decision",
  ]);
});

test("evidence vocabulary is provider-independent", () => {
  assert.deepEqual([...EVIDENCE_KINDS], [
    "image",
    "document",
    "testimonial",
    "metric",
    "link",
    "other",
  ]);

  assert.deepEqual([...EVIDENCE_VERIFICATION_STATES], [
    "unverified",
    "verified",
    "rejected",
  ]);
});

test("case verification and publication are separate concerns", () => {
  assert.deepEqual([...CASE_VERIFICATION_STATES], [
    "unverified",
    "partially_verified",
    "verified",
  ]);

  assert.deepEqual([...CASE_PUBLICATION_STATES], [
    "draft",
    "review",
    "approved",
    "published",
    "archived",
  ]);
});

test("case media vocabulary remains presentation-neutral", () => {
  assert.deepEqual([...CASE_MEDIA_KINDS], [
    "image",
    "video",
  ]);
});

test("case domain contract has no provider or rendering dependency", async () => {
  const source = await readFile(
    new URL("../../src/domains/cases/contracts.ts", import.meta.url),
    "utf8",
  );

  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(
    executableSource,
    /from\s+["'][^"']*astro[^"']*["']/i,
  );
  assert.doesNotMatch(executableSource, /supabase/i);
  assert.doesNotMatch(executableSource, /starterfunnels/i);
  assert.doesNotMatch(executableSource, /formspree/i);
  assert.doesNotMatch(executableSource, /google tag manager/i);
  assert.doesNotMatch(executableSource, /gtm-/i);
  assert.doesNotMatch(executableSource, /\batlas\b/i);
});

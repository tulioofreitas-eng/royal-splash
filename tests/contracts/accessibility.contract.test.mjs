import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SITE_ACCESSIBILITY_REQUIREMENT_KEYS,
  SITE_ACCESSIBILITY_SCHEMA_VERSION,
  SITE_ACCESSIBILITY_VERIFICATION_MODES,
} from "../../src/accessibility/index.ts";

test("site accessibility contract has an explicit schema version", () => {
  assert.equal(
    SITE_ACCESSIBILITY_SCHEMA_VERSION,
    "site-accessibility.v1",
  );
});

test("accessibility vocabulary covers semantic and interaction foundations", () => {
  assert.deepEqual(
    [...SITE_ACCESSIBILITY_REQUIREMENT_KEYS],
    [
      "document_language",
      "landmark_structure",
      "heading_structure",
      "accessible_name",
      "form_label_association",
      "keyboard_operability",
      "focus_visibility",
      "dialog_focus_management",
    ],
  );
});

test("verification modes distinguish static and runtime evidence", () => {
  assert.deepEqual(
    [...SITE_ACCESSIBILITY_VERIFICATION_MODES],
    [
      "static",
      "runtime",
      "both",
    ],
  );
});

test("accessibility requirement keeps scope and verification explicit", async () => {
  const source = await readFile(
    new URL(
      "../../src/accessibility/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteAccessibilityRequirement\s*{/,
  );

  assert.match(
    source,
    /\bkey:\s*SiteAccessibilityRequirementKey;/,
  );

  assert.match(
    source,
    /\bscopeRef:\s*string;/,
  );

  assert.match(
    source,
    /\bverification:\s*SiteAccessibilityVerificationMode;/,
  );
});

test("accessibility profile groups requirements without owning implementation", async () => {
  const source = await readFile(
    new URL(
      "../../src/accessibility/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteAccessibilityProfile\s*{/,
  );

  assert.match(
    source,
    /\bschemaVersion:\s*typeof SITE_ACCESSIBILITY_SCHEMA_VERSION;/,
  );

  assert.match(
    source,
    /\bprofileRef:\s*string;/,
  );

  assert.match(
    source,
    /\brequirements:\s*readonly SiteAccessibilityRequirement\[\];/,
  );
});

test("accessibility contract remains provider, renderer and brand independent", async () => {
  const source = await readFile(
    new URL(
      "../../src/accessibility/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(executableSource, /\bRoyal\b/i);
  assert.doesNotMatch(executableSource, /royalsplash/i);
  assert.doesNotMatch(executableSource, /\bastro\b/i);
  assert.doesNotMatch(executableSource, /\bplaywright\b/i);
  assert.doesNotMatch(executableSource, /\baxe\b/i);
  assert.doesNotMatch(executableSource, /\bfetch\s*\(/i);
  assert.doesNotMatch(executableSource, /process\.env/i);
  assert.doesNotMatch(executableSource, /import\.meta\.env/i);
});

/**
 * Provider- and renderer-independent accessibility contracts for Site Engine.
 *
 * These contracts describe verifiable accessibility requirements without
 * owning framework markup, browser tooling, automated scanners or
 * brand-specific implementation details.
 */

export const SITE_ACCESSIBILITY_SCHEMA_VERSION =
  "site-accessibility.v1" as const;

export const SITE_ACCESSIBILITY_REQUIREMENT_KEYS = [
  "document_language",
  "landmark_structure",
  "heading_structure",
  "accessible_name",
  "form_label_association",
  "keyboard_operability",
  "focus_visibility",
  "dialog_focus_management",
] as const;

export type SiteAccessibilityRequirementKey =
  (typeof SITE_ACCESSIBILITY_REQUIREMENT_KEYS)[number];

export const SITE_ACCESSIBILITY_VERIFICATION_MODES = [
  "static",
  "runtime",
  "both",
] as const;

export type SiteAccessibilityVerificationMode =
  (typeof SITE_ACCESSIBILITY_VERIFICATION_MODES)[number];

export interface SiteAccessibilityRequirement {
  key: SiteAccessibilityRequirementKey;
  scopeRef: string;
  verification: SiteAccessibilityVerificationMode;
}

export interface SiteAccessibilityProfile {
  schemaVersion: typeof SITE_ACCESSIBILITY_SCHEMA_VERSION;
  profileRef: string;
  requirements: readonly SiteAccessibilityRequirement[];
}

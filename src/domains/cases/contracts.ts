/**
 * Provider-independent Site Engine contracts for Cases, Evidence and Provenance.
 *
 * This module owns domain vocabulary only.
 *
 * It must not depend on:
 * - Astro rendering;
 * - Supabase;
 * - Atlas;
 * - GTM / GA4;
 * - external providers;
 * - Royal-specific content.
 *
 * Runtime/content validation belongs to the validation layer.
 */

export const PROVENANCE_SOURCE_KINDS = [
  "foundation_record",
  "brand_system",
  "brand_activation_package",
  "site_repository",
  "client_supplied",
  "external_source",
  "human_decision",
] as const;

export type ProvenanceSourceKind =
  (typeof PROVENANCE_SOURCE_KINDS)[number];

export const EVIDENCE_KINDS = [
  "image",
  "document",
  "testimonial",
  "metric",
  "link",
  "other",
] as const;

export type EvidenceKind =
  (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_VERIFICATION_STATES = [
  "unverified",
  "verified",
  "rejected",
] as const;

export type EvidenceVerificationState =
  (typeof EVIDENCE_VERIFICATION_STATES)[number];

export const CASE_VERIFICATION_STATES = [
  "unverified",
  "partially_verified",
  "verified",
] as const;

export type CaseVerificationState =
  (typeof CASE_VERIFICATION_STATES)[number];

export const CASE_PUBLICATION_STATES = [
  "draft",
  "review",
  "approved",
  "published",
  "archived",
] as const;

export type CasePublicationState =
  (typeof CASE_PUBLICATION_STATES)[number];

export const CASE_MEDIA_KINDS = [
  "image",
  "video",
] as const;

export type CaseMediaKind =
  (typeof CASE_MEDIA_KINDS)[number];

export interface ProvenanceRef {
  id: string;
  sourceKind: ProvenanceSourceKind;
  sourceRef: string;
  sourceVersion?: string;
  locator?: string;
  capturedAt?: string;
  note?: string;
}

export interface Evidence {
  schemaVersion: "evidence.v1";
  id: string;
  kind: EvidenceKind;
  title?: string;
  summary?: string;
  resourceRef?: string;
  verificationState: EvidenceVerificationState;
  provenance: readonly ProvenanceRef[];
}

export interface CaseMedia {
  schemaVersion: "case-media.v1";
  id: string;
  kind: CaseMediaKind;
  resourceRef: string;
  evidenceRef?: string;
}

export interface SiteCase {
  schemaVersion: "case.v1";
  id: string;
  slug: string;
  title: string;
  summary: string;
  serviceRefs: readonly string[];
  evidenceRefs: readonly string[];
  media: readonly CaseMedia[];
  verificationState: CaseVerificationState;
  publicationState: CasePublicationState;
  provenance: readonly ProvenanceRef[];
}

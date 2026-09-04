# T1-B WP3 — Case / Evidence / Provenance Contract

## Purpose

Establish provider-independent domain contracts for the Site Engine Case,
Evidence and Provenance model.

This work package defines structure and vocabulary only.

It does not create Royal Splash case content and does not decide whether any
existing project, testimonial, metric or media item is verified.

## Domain separation

### SiteCase

Represents a publishable case record independent of rendering and providers.

Case publication state and case verification state are intentionally separate.

A case may move through editorial workflow without that workflow silently
changing the verification status of its underlying proof.

### Evidence

Represents an evidence item that may support site content.

Evidence carries its own verification state and provenance references.

Evidence is not automatically treated as institutional truth.

### ProvenanceRef

Records where a piece of information or evidence originated.

Supported source families distinguish:

- Foundation Record;
- Brand System;
- Brand Activation Package;
- Site repository;
- client-supplied material;
- external sources;
- explicit human decisions.

Provenance does not elevate an external or client-supplied source into
Foundation truth.

### CaseMedia

Represents media attached to a Case.

Media may optionally reference Evidence, but the relationship is not validated
inside this domain module.

## Versioning

The first contract versions are:

- case.v1
- evidence.v1
- case-media.v1

Future incompatible changes require explicit version evolution.

## Deferred to WP4

WP3 does not perform content validation.

WP4 will establish deterministic rules such as:

- required non-empty identifiers;
- slug format;
- duplicate identifier detection;
- valid cross-references;
- provenance requirements;
- evidence-reference integrity;
- publication conflict checks;
- verification conflict checks.

## Boundaries

WP3 must not:

- import Astro;
- access Supabase;
- call Atlas;
- publish analytics;
- define final Brand visual identity;
- create Royal-specific proof claims;
- infer verification from existing website content.

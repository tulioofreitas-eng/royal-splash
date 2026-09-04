# Royal Splash — T1-B Gate 4B Evidence Record

## Purpose

This document consolidates the verifiable evidence produced by Royal Splash
Tranche 1 before MASTER convergence.

It is an evidence record only.

It does not:
- authorize merge to main;
- authorize Production deployment;
- authorize Production configuration changes;
- authorize Atlas operational workflow changes;
- authorize GTM, GA4 or Google Ads publication/configuration changes;
- authorize final visual identity implementation;
- authorize the next implementation tranche.

MASTER remains responsible for canonical convergence and authorization.

## Canonical boundaries

Mode:

`EXISTING SITE EVOLUTION`

Strategy:

`EVOLVE EXISTING`

Important:

`EVOLVE EXISTING != PRESERVE CURRENT IMPLEMENTATION`

Royal Splash is Reference Implementation #1 for Site Engine.

Foundation and Brand remain upstream sources of truth.

Site Engine does not redefine:
- positioning;
- institutional promises;
- brand principles;
- final visual identity.

Atlas remains downstream of the normalized Site lead-ingress boundary.

Growth remains a separate system. Landing-page ownership must remain explicit
where Site and Growth responsibilities overlap.

## Immutable safety baseline

T1-S0 safety baseline:

`42ce4e604bf2d721672c716526b17fae0f07fba7`

Commit:

`fix(safety): preserve whatsapp tracking semantics`

The safety baseline remained unchanged during T1-B implementation.

Verified delta from the safety baseline through the T1-B implementation
checkpoint contains no changes under:

- `src/safety`
- `tests/safety`

The same delta contains no changes to the following existing
Production/provider-sensitive surfaces:

- `src/pages/api`
- `src/components/Formulario.astro`
- `src/components/FormularioGHL.astro`
- `src/components/GTMHead.astro`
- `src/components/GTMBody.astro`
- `src/components/BotaoWhatsapp.astro`

## T1-B implementation checkpoint

Implementation checkpoint:

`16e4973cbb0528fb8595986e52c5cab39fa6c0cd`

Commit:

`feat(accessibility): define accessibility contracts`

This SHA is the end of the nine implementation commits that followed the
immutable T1-S0 baseline.

Evidence-hardening documentation added after this checkpoint is not counted as
part of those nine implementation commits.

## Ordered implementation commit chain

1. `a76cf9df78916c26e496d7c5ac72ecdb28380a2f`
   `chore(architecture): establish tranche 1 module boundaries`

2. `15837461db2b3b4aec83738149309967390d5a80`
   `feat(cases): define evidence provenance contracts`

3. `be5edc9412a585734731c20948c9a993ae112ecc`
   `feat(content): add deterministic case validation`

4. `a6830942af4100a77ff65eb568010c244d5dad51`
   `feat(templates): define page template contracts`

5. `37bd23d772a0e7e410a3f07e0e426749eba20489`
   `feat(leads): define normalized ingress contract`

6. `9e8d08641c21f1c318d2bcc11a2e2f2057c94238`
   `feat(leads): add in-memory ingress adapter`

7. `dbf4e0b549bfbd08595cfb68aac04548cc5efa5c`
   `feat(analytics): define semantic event contracts`

8. `87bf2d0d907ee19552e096e01cedfa420e842926`
   `feat(seo): define page SEO contracts`

9. `16e4973cbb0528fb8595986e52c5cab39fa6c0cd`
   `feat(accessibility): define accessibility contracts`

## Baseline-to-checkpoint delta

Verified file delta:

- 32 files added
- 2231 insertions
- no Safety-file modification after the immutable baseline
- no Production/provider-sensitive implementation modification after the
  immutable baseline

The delta is concentrated in the authorized T1-B architecture:

- `docs/architecture`
- `src/domains`
- `src/content`
- `src/templates`
- `src/integrations`
- `src/analytics`
- `src/seo`
- `src/accessibility`
- `src/validation`
- `tests/contracts`

## Work-package evidence

### WP1 — Repository Responsibility Scaffold

Status:

`CLOSED / PASS`

Established repository responsibility boundaries for:

- pages/routes;
- components;
- domains;
- content;
- templates;
- integrations;
- analytics;
- SEO;
- validation;
- contract tests.

No existing routes or components were migrated by WP1.

### WP2 — Environment Contract / Guardrails

Status:

`SATISFIED / FROZEN`

Satisfied by the previously approved T1-S0 safety baseline.

T1-B did not alter that baseline.

### WP3 — Case / Evidence / Provenance Contracts

Status:

`CLOSED / PASS`

Established provider-independent contracts separating:

- Case;
- Evidence;
- Provenance;
- publication state;
- verification state;
- media references.

Evidence is not automatically institutional truth.

### WP4 — Content Validation Layer

Status:

`CLOSED / PASS`

Established deterministic validation for:

- identifiers;
- slugs;
- duplicate records;
- evidence references;
- media evidence references;
- optional service registries;
- publication conflicts;
- verification conflicts.

Validation does not require Production services.

### WP5 — Page / Template Contract Foundation

Status:

`CLOSED / PASS`

Established explicit contracts for:

- Site versus Landing template families;
- Site Engine versus shared Site/Growth ownership;
- route identity;
- template selection;
- content references.

No current route migration was performed.

### WP6 — Site-to-Atlas Domain Contract

Status:

`CLOSED / PASS`

Established normalized `site-lead.v1` ingress contracts.

The contract separates Site lead semantics from provider implementation.

Atlas remains behind the ingress adapter boundary.

### WP7 — Mock / Test Ingress Adapter

Status:

`CLOSED / PASS`

Established an in-memory adapter implementing the normalized lead-ingress port.

The adapter has no network, provider or Production dependency.

### WP8 — Semantic Analytics Contract

Status:

`CLOSED / PASS`

Established provider-neutral semantic events:

- `page_viewed`
- `cta_activated`
- `lead_submitted`

The semantic contract contains no lead PII and does not select GTM, GA4 or
Google Ads as domain truth.

### WP9 — SEO Contract Foundation

Status:

`CLOSED / PASS`

Established independent policies for:

- metadata;
- canonical identity;
- indexing;
- following;
- sitemap participation;
- structured-data references.

No Production Search Console, redirect or schema publication was performed.

### WP10 — Accessibility / Test Foundations

Status:

`CLOSED / PASS`

Established verifiable accessibility requirement vocabulary covering:

- document language;
- landmark structure;
- heading structure;
- accessible names;
- form-label association;
- keyboard operability;
- focus visibility;
- dialog focus management.

Verification modes are explicit:

- `static`
- `runtime`
- `both`

No Playwright, axe or browser-testing dependency was introduced.

No existing page/component markup was remediated by WP10.

## Automated verification checkpoint

At WP10 closure:

- combined contract + safety suite: `82 / 82 PASS`
- Preview-classified Astro/Vercel build: `PASS`
- local worktree: clean

The existing Safety suite remained green together with all T1-B contract tests.

## Remote verification checkpoint

Implementation checkpoint:

`16e4973cbb0528fb8595986e52c5cab39fa6c0cd`

Remote branch:

`feat/royal-t1-core-architecture-contracts`

Remote branch comparison at verification:

- ahead by: `0`
- behind by: `0`
- state: identical

Vercel commit status:

`success`

Verified Preview deployment:

`dpl_Gc45z1s3cDZ1CRThQKgPnXcvRemr`

Preview URL:

`https://royal-splash-pn0c8jwa5-mtm-group.vercel.app`

Deployment target:

`preview`

Deployment status:

`Ready`

## Preview functional / safety evidence

Verified on the WP10 Preview:

### `/contato`

- HTTP `200`
- `/api/lead` form action present exactly once
- `data-production-lead-egress="false"` present
- forbidden Production integration markers absent

### `/lp/piscinas`

- HTTP `200`
- forbidden Production integration markers absent

### `/api/lead`

Valid Preview submission:

- HTTP `200`
- response: `{"ok":true,"mock":true}`

### `/api/whatsapp-click`

Valid Preview request:

- HTTP `200`
- response: `{"ok":true,"mock":true}`

Malformed JSON Preview request:

- HTTP `200`
- response: `{"ok":true,"mock":true}`

Empty JSON-body Preview request:

- HTTP `200`
- response: `{"ok":true,"mock":true}`

The empty-body behavior was also compared against the WP9 baseline Preview and
produced the same result.

A prior request without JSON content type produced HTTP `403` from runtime
origin/form protection. The controlled differential established that this was
not a WP10 endpoint regression.

## Provider boundary evidence

The repository currently contains existing provider implementations and
Production integrations inherited from the pre-T1-B site.

T1-B did not redefine them as Site Engine domain truth.

Supabase/Atlas operational readiness is not claimed by this evidence record.

No Supabase schema, table, policy, project configuration or Production data
change was performed by T1-B.

## What T1-B does not claim

T1-B does not claim completion of:

- final Brand System;
- final Brand Book;
- final Brand Activation Package;
- final visual identity application;
- final page UI;
- final component styling;
- responsive remediation of the existing site;
- runtime accessibility remediation of the existing site;
- browser-level accessibility automation;
- Production Atlas integration;
- Production lead routing changes;
- Production analytics publication/configuration;
- Search Console configuration;
- Production structured-data publication;
- Production redirects;
- Production deployment;
- merge to `main`;
- Growth campaigns or Growth-owned experimentation.

## Gate 4B convergence interpretation

The evidence supports the following statement:

T1-B established the authorized architecture and contract foundations without
modifying the immutable T1-S0 safety baseline or existing
Production/provider-sensitive implementation surfaces.

This evidence record is suitable as an input to MASTER convergence.

It does not itself grant the next implementation tranche.

## System Learning

### SYSTEM CAPABILITY

Provider-independent boundaries for:

- Case / Evidence / Provenance;
- content validation;
- page/template composition;
- normalized Site lead ingress;
- lead adapter boundary;
- semantic analytics;
- SEO policy;
- accessibility requirements.

### CANDIDATE_REUSABLE

- explicit publication versus verification states;
- deterministic content validation;
- Site versus shared Site/Growth ownership;
- normalized lead-ingress port;
- semantic analytics events independent of providers;
- separate SEO indexing/following/sitemap policies;
- accessibility verification modes `static / runtime / both`.

These remain candidate reusable patterns until repeated evidence justifies a
stronger system classification.

### TECHNICAL_CONSTRAINT

The current repository does not yet contain browser-level accessibility tooling
such as Playwright or axe.

### HUMAN_DECISION

Future browser/a11y tooling selection and final motion/tooling choices require
explicit implementation decisions.

### SITE_SPECIFIC

Accessibility and interaction gaps observed in the current Royal implementation
remain Royal-specific findings until generalized evidence exists.

Examples include current Header, forms, gallery/lightbox and WhatsApp/modal
interaction behavior.

## Convergence input

Recommended disposition for MASTER review:

`T1-B ARCHITECTURE FOUNDATION = READY FOR CONVERGENCE REVIEW`

This is a recommendation based on the verified evidence above.

Final canonical disposition remains owned by MASTER.

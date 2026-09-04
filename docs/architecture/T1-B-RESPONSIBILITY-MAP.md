# Royal Splash — Tranche 1 Responsibility Map

## Baseline

T1-S0 safety baseline:
42ce4e604bf2d721672c716526b17fae0f07fba7

The T1-S0 safety boundary is immutable unless MASTER reviews a required change.

## Repository responsibilities

### src/pages

Route responsibility only.

Target direction:
- URL resolution;
- page-specific data selection;
- metadata input;
- template selection.

Routes must progressively become thin.
Existing routes are not relocated by WP1.

### src/components

Presentation and interaction components.

Components must not own:
- domain truth;
- production persistence;
- Atlas workflow;
- provider-specific business rules.

Existing components are not reorganized by WP1.

### src/domains

Provider-independent domain contracts and behavior.

Domain code must not depend on:
- Astro rendering;
- Supabase;
- Atlas implementation;
- GTM/GA4;
- presentation components.

Initial domains will include Case/proof and lead-ingress contracts.

### src/content

Repository-owned structured site content.

Content must remain distinct from:
- rendering;
- persistence;
- provider integrations.

Verified evidence and narrative content must remain distinguishable.

### src/templates

Recurring page-composition contracts.

Templates may compose:
- domain data;
- validated content;
- semantic components.

Templates must not directly perform persistence or provider integration.

### src/integrations

External-provider adapters and integration boundaries.

Provider implementation must not become domain truth.

Atlas belongs behind an adapter boundary.

### src/analytics

Provider-neutral semantic Site analytics contracts.

Production GTM/GA4/Ads publication is outside Tranche 1.

### src/seo

Metadata, indexability, structured-data and redirect contracts.

Production redirect activation and Search Console configuration are outside Tranche 1.

### src/validation

Reusable contract/content validation.

Validation should be deterministic and testable without production services.

### tests/contracts

Domain and contract-level tests independent of Production services.

## Safety boundary

The following existing safety implementation is not owned by WP1:

- src/safety/environment.ts
- src/safety/runtime.ts
- src/safety/lead-provider.ts
- src/safety/production-supabase.ts
- tests/safety/

WP1 must not modify these files.

## Brand boundary

This scaffold carries no Royal visual identity truth.

No final typography, palette, spacing, art direction or motion language is defined here.

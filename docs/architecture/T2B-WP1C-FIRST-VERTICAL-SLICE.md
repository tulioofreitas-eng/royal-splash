# Royal Splash — T2B WP1C — First Functional Vertical Slice Contract

## Status

T2B-WP1C = IMPLEMENTATION CONTRACT

Reference implementation:

ROYAL SPLASH

Target:

GATE 4C — FUNCTIONALLY COMPLETE

Base checkpoint:

42ebd966140842b9e5f18844895b292258a99a31

## Canonical boundaries

Preserve:

- MODE = EXISTING SITE EVOLUTION
- STRATEGY = EVOLVE EXISTING
- IMPLEMENTATION APPROACH = PARTIAL TECHNICAL REBUILD
- Production = UNCHANGED
- merge to main = NOT AUTHORIZED
- final Brand integration = BLOCKED
- Atlas Production integration = NOT AUTHORIZED
- Growth campaigns / experiments = OUT OF SCOPE

Foundation / Brand remains the source of institutional and visual truth.

## Gate 3A experience model

Preserve:

SEGMENT + PROOF + METHOD + CONVERSION

Journey model:

ENTRY → CONTEXT → PROOF → METHOD / TRUST → QUALIFIED ACTION

The first functional slice does not need to implement every target page.

It must prove that the approved experience architecture can operate
end-to-end on the T2A runtime foundation.

## First functional vertical slice

Target path:

Home
→ Residential / Corporate-Institutional context
→ context-aware primary action
→ Inicie seu projeto
→ structured intake
→ site-lead.v1
→ mock/test ingress

WhatsApp remains an assisted / alternative path.

It must not replace structured intake.

## Scope

### 1. Navigation

Implement the target primary IA contract:

- Logo / Home
- Projetos
- Residencial
- Corporativo / Institucional
- Método Royal
- A Royal
- Inicie seu projeto

Contato remains auxiliary.

Desktop navigation:

REFINE

Mobile navigation:

REBUILD

Mobile behavior must support:

- explicit trigger;
- complete primary IA;
- prioritized primary CTA;
- keyboard operation;
- predictable open/closed state;
- explicit closure;
- managed focus.

### 2. Home

Home is the Site orchestrator.

The first slice must establish functional architecture for:

- Royal context/relevance;
- Residential / Corporate-Institutional routing;
- proof bridge;
- method/trust bridge;
- primary qualified conversion.

Home must not attempt to contain the complete Site.

No unsupported claim, testimonial, metric or proof may be introduced.

### 3. Segment routing

Preserve:

Residential / Corporate segmentation = KEEP + REFINE

The slice must allow users to identify and continue through the
relevant context without requiring a return to Home.

Corporativo / Institucional is a working Site label only.

It does not redefine Royal institutionally.

### 4. Conversion

Primary qualified CTA:

INICIE SEU PROJETO

Destination:

structured intake

WhatsApp / direct contact:

assisted / alternative path

The primary architecture must not degrade into:

page → generic contact → Home → restart

### 5. Structured intake

Structured intake is NEW.

Progressive intake is NEW.

Gate 3A conceptual sequence:

1. project context;
2. need / scope;
3. relevant project conditions;
4. contact / consent;
5. review where useful;
6. submission;
7. confirmation / handoff expectation.

The final public field schema remains a HUMAN_DECISION.

T2B may use the minimum normalized data necessary to prove the
site-lead.v1 technical boundary.

Such fields are implementation fixtures and must not be interpreted
as the final approved public intake schema.

Required behavior includes:

- progressive disclosure;
- clear progress;
- explicit labels;
- required / optional semantics;
- adjacent validation;
- actionable errors;
- preservation of entered values;
- submission-error recovery;
- accessible success state;
- explicit successful-submission confirmation;
- no unsupported response-time promise.

### 6. Lead boundary

The slice must terminate at:

site-lead.v1
→ mock/test ingress

No Production Atlas call is authorized.

No Production Supabase lead persistence change is authorized.

No existing Production provider must become Site Engine domain truth.

### 7. Analytics

Semantic instrumentation may use the approved provider-neutral events:

- page_viewed;
- cta_activated;
- lead_submitted.

No Production GTM / GA4 publication or configuration change is authorized.

No lead PII may be introduced into semantic analytics events.

### 8. Accessibility

New/rebuilt slice components must support:

- document language;
- semantic landmarks;
- coherent heading structure;
- accessible names;
- explicit form labels;
- keyboard operation;
- visible focus;
- managed mobile-navigation focus;
- accessible form errors and success;
- skip-to-content.

Browser verification uses the approved Playwright + axe harness.

Automated axe results supplement rather than replace behavioral checks.

### 9. Responsive

Preserve:

RESPONSIVE = PRESERVE MEANING + PRIORITY + ACTION,
NOT DESKTOP GEOMETRY

No essential interaction may depend on hover.

Forms default to a single-column mobile flow.

Mobile navigation is an intentional interaction, not scaled desktop geometry.

### 10. Brand boundary

T2B must not define final:

- typography;
- palette;
- visual tokens;
- composition language;
- imagery treatment;
- final motion expression;
- detailed branded component styling.

Functional neutral styling may be used only to make hierarchy,
state and behavior verifiable.

It must not be treated as Royal Brand truth.

## Technical disposition for the slice

- SiteLayout = KEEP + EXTEND
- Primary navigation = REFINE
- Mobile navigation = REBUILD
- Home functional architecture = REFINE
- Residential / Corporate routing = KEEP + REFINE
- Structured Intake = NEW
- Progressive Intake = NEW
- WhatsApp assisted behavior = REFINE
- browser accessibility verification = KEEP + EXTEND
- legacy generic contact form = NOT CANONICAL for qualified intake
- Production Atlas adapter = OUT OF SCOPE
- Production analytics publication = OUT OF SCOPE

## Controlled implementation sequence

1. WP1D — Target Navigation Shell
2. WP1E — Home Orchestration + Segment Router
3. WP1F — Structured Intake + Mock Ingress
4. WP1G — Functional / Accessibility Verification

Each package must be independently reviewed before commit.

## Human decisions preserved

The following remain unresolved and must not be silently frozen:

- final public Corporativo / Institucional label;
- final structured-intake field schema;
- proof / evidence inventory and provenance;
- final WhatsApp presentation / ownership behavior;
- final Brand-controlled visual expression.

## System learning

This contract creates no new SYSTEM_CORE learning.

Royal remains Reference Implementation #1.

Observed solutions remain case evidence until promoted through
the Site Engine learning governance.

# Royal Splash — T2B-WP1G Verification Record

## 1. Status

T2B-WP1G — Functional / Accessibility Verification

VERIFICATION = PASS

Verification baseline:

- branch: `feat/royal-t2b-functional-experience`
- implementation checkpoint:
  `6048ba74e4cbb004eeb9c8a005444a941d3609df`

This work package introduces no product/runtime behavior.

Its purpose is to preserve executable evidence for the first
T2B functional vertical slice.

## 2. Verified vertical slice

The verified experience is:

Home
→ Residential / Corporate-Institutional context
→ contextual qualified CTA
→ Inicie seu projeto
→ structured intake
→ normalized `site-lead.v1`
→ Preview mock ingress
→ acknowledged success

Semantic analytics verified during the flow:

- `page_viewed`
- `cta_activated`
- `lead_submitted`

Analytics verification confirms semantic metadata only and no
lead PII in the observed event buffer.

## 3. Residential end-to-end evidence

The browser closure test verifies:

- Home entry;
- Residential context selection;
- `/servicos`;
- qualified Residential CTA;
- context query propagation;
- Residential intake preselection;
- managed focus during progressive intake;
- successful POST to `/api/site-lead-preview`;
- HTTP 200;
- response:
  - `ok: true`
  - `mock: true`
  - `schemaVersion: site-lead.v1`
  - `submittedCount: 1`
- success state visible;
- success state focused;
- semantic `lead_submitted`;
- analytics buffer excludes fixture name, email, city and
  project-description content.

## 4. Corporate / Institutional mobile evidence

The browser closure test verifies:

- mobile viewport `390x844`;
- Home context router;
- Corporate / Institutional route;
- qualified contextual CTA;
- context propagation into intake;
- `corporativo_institucional` preselection;
- managed focus;
- entered-value preservation across progressive navigation;
- no horizontal overflow on the tested flow.

## 5. Accessibility evidence

Browser verification proves for the first vertical slice:

- keyboard-accessible skip link;
- skip link targets `#main-content`;
- focus moves to the primary main landmark;
- navigation keyboard/focus behavior remains covered by the
  existing browser suite;
- structured-intake validation/focus behavior remains covered;
- automated axe scans report zero violations on the new
  closure surfaces tested;
- representative responsive surfaces have no horizontal
  overflow in the verified mobile viewport.

Automated axe results are evidence only.

They do not establish complete accessibility conformance.

## 6. Regression evidence

At WP1G verification:

- targeted WP1G browser tests: `3/3 PASS`
- full browser suite: `19/19 PASS`
- contract/runtime/safety suite: `96/96 PASS`
- Preview build: `PASS`

Exit state:

- `WP1G_EXIT=0`
- `BROWSER_EXIT=0`
- `BASELINE_EXIT=0`
- `BUILD_EXIT=0`

## 7. Runtime / Production boundary

WP1G changed no product code.

Verified unchanged boundaries include:

- Production lead API;
- WhatsApp API;
- Preview lead ingress implementation;
- lead domain contract;
- in-memory lead adapter;
- semantic analytics runtime;
- semantic analytics installer.

No Production deployment is authorized by this record.

No Atlas Production integration is authorized by this record.

No merge to `main` is authorized by this record.

## 8. Known residual

The representative legacy `/sobre` accessibility diagnostic
continues to report:

`AXE_BASELINE_VIOLATIONS=1`

This is a pre-existing known baseline outside the new vertical
slice surfaces.

It is not treated as a WP1G regression.

It remains an open remediation item before final Gate 4C
accessibility closure.

## 9. Brand boundary

This verification does not approve or define:

- final typography;
- final palette;
- final visual tokens;
- graphic language;
- art direction;
- final media treatment;
- final motion language.

Final Brand Integration remains separately blocked.

## 10. WP1 disposition

Subject to versioning this verification record and its executable
closure test:

`T2B-WP1 — FIRST FUNCTIONAL VERTICAL SLICE`

is ready for:

`COMPLETE / ACCEPTED`

This disposition does not close Tranche 2B or Gate 4C.

Next implementation workstream after WP1 closure:

`T2B-WP2 — CORE EXPERIENCE PAGES`

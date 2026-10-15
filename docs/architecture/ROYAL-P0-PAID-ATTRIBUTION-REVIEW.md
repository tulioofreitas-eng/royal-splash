# Royal Splash — P0 Paid Attribution (Draft / Human Gate)

## Delivered in this PR
- Normalize external `utm_medium=cpc` and `utm_medium=ppc` to the existing canonical Atlas value `paid_search`.
- Preserve the supported `utm_source=google`, `utm_campaign` and page references through the existing first-touch and submission-touch flow.
- When Marketing measurement consent is granted (or was already granted), persist observed first-touch attribution before a full-page navigation. Do not persist merely on page observation or Analytics-only consent.
- Keep the public API and the Atlas database schema unchanged.
- Add unit tests for canonicalization and non-storage of Google click identifiers.

## Deliberately NOT delivered yet
Google click identifiers (`gclid`, `gbraid`, `wbraid`) are **not collected, persisted, emitted into dataLayer or sent to Atlas** in this PR. They are not part of the current Atlas site-origin schema.

Before adding identifiers, a separate cross-repository design and privacy gate must approve:
1. Purpose and lawful basis; respect the selected measurement-consent model, including rejection and withdrawal.
2. Validation and bounds for each identifier (size, format, multiple or conflicting parameters, provenance limits).
3. Storage destination and strict access policy; no contact PII or click identifiers in logs, links, analytics events or query strings after ingestion.
4. Retention/deletion policy and lifecycle aligned between browser and Atlas, including revocation.
5. Versioned Atlas ingress contract and DB migration, coordinated with site release; safe compatibility and rollback.
6. End-to-end tests with synthetic IDs **only in isolated test data**, not sent to Google Ads.
7. Evidence of correct Google Ads auto-tagging or final-URL suffix before inferring that paid clicks always arrive with UTM parameters.

**Do not interpret absence of click IDs in Atlas as proof of broken online Google Ads conversion tags.**

## Verification
`npx vitest run tests/runtime/paid-search-attribution.test.ts`

No Google Ads changes, no Consent Mode changes, no production DB changes, no merge or deploy in this draft.

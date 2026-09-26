# Royal Splash Consent Mode v2 / Google Ads Conversion Reliability RI

Status: DRAFT IMPLEMENTATION — NOT PRODUCTION AUTHORIZED  
Workpackage: Royal issue #7  
Branch: `feat/royal-consent-mode-v2-ri`

## Purpose

Close the gap where the MCC Google Ads conversion tag resolves the expected
Conversion ID and Conversion Label in GTM/Tag Assistant but the corresponding
conversion request was not observed by Google Ads troubleshooting.

This RI separates:

1. **Form/data-processing consent** — permission to send the customer's request
   to Royal Splash / Atlas.
2. **Measurement consent** — optional Analytics and Marketing choices governing
   Google measurement.

The two consents must never be conflated.

## Site implementation in this branch

### Consent defaults

Before the GTM container may execute, the page records an explicit Google
Consent Mode state for:

- `analytics_storage`
- `ad_storage`
- `ad_user_data`
- `ad_personalization`

For a visitor with no saved measurement preference, all four default to
`denied`.

### Basic-mode loading rule

The GTM container is not loaded until the visitor grants at least one optional
measurement category.

- Analytics only → `analytics_storage=granted`; advertising consent remains
  denied.
- Marketing only → advertising consent types are granted;
  `analytics_storage=denied`.
- Both → all four granted.
- Deny all → GTM remains unloaded.

A saved choice is restored before the container loading decision.

### Measurement preference UI

Measured campaign surfaces receive a preference banner with:

- Accept all
- Reject optional
- Customize
  - Analytics
  - Marketing / conversions
- Save preferences
- Re-open preferences control

The user's choice is persisted as a small localStorage record containing only:

- contract version
- analytics boolean
- marketing boolean

No lead/contact PII is stored in the measurement preference.

### Canonical conversion boundary

Atlas persistence remains the business authority.

```
form
  -> Royal backend
  -> Atlas canonical Intake persisted
  -> accepted receipt
  -> royal:intake-created browser signal
  -> consent-aware GTM intake_created delivery
```

The provider-independent `royal:intake-created` signal remains post-persistence
and replay-safe.

The GTM `intake_created` event is delivered only when Marketing consent is
granted in production. Preview/test keeps deterministic dataLayer behavior
because production measurement is disabled there.

WhatsApp GTM events are also gated by Marketing consent. The internal
`/api/whatsapp-click` diagnostic contract is unchanged.

## Required GTM work before production acceptance

The site branch alone is **not sufficient for production authorization**.

The current GTM container contains legacy and MCC advertising tags. Before this
RI can close, apply and validate consent requirements in GTM.

### Advertising tags

Require Marketing consent for advertising conversion tags:

- `Google Ads — MCC — RS | Intake criado`
- `Intake criado — Royal Splash`
- `pagina de obrigado`
- `Tag whatsapp`

Expected required consent types:

- `ad_storage`
- `ad_user_data`
- `ad_personalization`

### MCC Google tag

`Google tag — MCC MTM GROUP` must remain aligned to the same Marketing consent
contract. Do not make it an Analytics prerequisite.

The site now exposes the non-PII GTM event:

```text
event = royal_measurement_consent
analytics_consent = true|false
marketing_consent = true|false
```

Use this event for **category routing**, not Tag Manager Additional Consent Checks.
The MCC Ads Google tag should move from `Initialization - All Pages` to a
custom-event trigger that fires only when:

```text
event == royal_measurement_consent
marketing_consent == true
```

This preserves Google's built-in Consent Mode behavior inside the Ads tag while
preventing the Ads base tag from being instantiated on an Analytics-only choice.
The event is emitted after the GTM container is queued, for both saved choices
and in-page preference updates.

### Conversion Linker

Review `Vinculador de conversões` under the same Marketing boundary. It must
not become a path that bypasses a denied advertising choice.

### Legacy mixed Google tag

The existing legacy Google tag currently has mixed destinations. It must be
reviewed before Analytics-only acceptance because a single mixed tag cannot be
treated as both the Analytics-only and Marketing-only authority by assumption.

Do not delete the legacy tag during the migration overlap.

If destination separation is required, perform it as a controlled GTM change
and validate both old and new destinations before removing any legacy path.

## Validation matrix

### Case A — no choice yet

Expected:

- default consent observable in Tag Assistant
- all four optional consent types denied
- GTM container not loaded
- form remains usable

### Case B — deny all

Expected:

- GTM remains unloaded
- structured intake can still persist successfully
- no `intake_created` GTM conversion event
- no WhatsApp GTM marketing event

### Case C — Analytics only

Expected:

- Analytics consent granted
- Marketing consent denied
- no Ads conversion on accepted intake
- no Ads conversion on WhatsApp click
- no legacy thank-you Ads conversion

### Case D — Marketing only

Expected:

- Analytics denied
- advertising consent types granted
- accepted non-replay Intake produces exactly one `intake_created`
- MCC conversion fires independently of Analytics consent

### Case E — both

Expected:

- all four consent types granted
- accepted non-replay Intake produces exactly one MCC conversion
- no `/obrigado` duplicate
- no WhatsApp primary-conversion duplicate

## Network proof required

For the MCC action:

- Conversion ID: `18470841900`
- Conversion label: `hsZICLmbriUdEKzcyudE`

Closure requires browser Network evidence showing the actual Ads conversion
request corresponding to the accepted Intake, not merely:

- base Google tag load
- `page_view`
- `gtag.config`
- `1p-user-list`

## Destination proof required

Google Ads troubleshooting must detect `RS | Intake criado`.

The RI remains OPEN until both browser evidence and destination evidence agree.

## Migration safety

Do not:

- remove the legacy Royal conversion during overlap
- promote `/obrigado` back to canonical conversion
- make WhatsApp click the primary Intake conversion
- add PII to dataLayer
- enable Enhanced Conversions as part of this RI
- change campaign bidding/budget/spend
- force consent to `granted`

## Engineering boundary

Successful closure may provide evidence for an MTM Engineering candidate.
Until then:

**RI evidence != Engineering standard.**

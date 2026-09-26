# Royal Splash — Consent Mode v2 + MCC Intake

## Final production handoff

**Date:** 2026-09-26  
**Status:** PASS — production cutover validated  
**Repository:** `tulioofreitas-eng/royal-splash`  
**Production merge commit:** `ee4f0099bf2dcf94e3425890c8c2cc0f2a813765`  
**GTM container:** `GTM-TFW2WDRG`

## Scope closed

This RI closed the Consent Mode v2 and Google Ads conversion-reliability migration for Royal Splash.

The canonical conversion boundary remains:

```text
form submitted
  -> Royal backend
  -> Atlas canonical Intake persisted
  -> accepted receipt
  -> royal:intake-created browser signal
  -> consent-aware GTM intake_created event
  -> Google Ads conversion tags
```

`/obrigado` is not the canonical conversion boundary.

## Production Google tag topology

### Legacy Ads

- Google Ads account: `272-450-1192`
- Google tag ID: `AW-18313732403`
- Destination: Royal Splash Google Ads
- Administrative tag name remained `Untitled tag` at closeout because the Google Ads interface exposed the name as read-only.
- Rename to `Royal Splash — Ads legado` is optional administrative cleanup and is not a release blocker.

### GA4

- Google tag: `Royal Splash — GA4`
- Google tag ID: `GT-WKR2WLQ8`
- GA4 destination / Measurement ID: `G-20754X4KB7`
- GA4 destination was moved off the mixed legacy tag before GTM publication.

### MCC

- MCC: `874-267-2466`
- MCC Google tag ID: `AW-18470841900`

## Conversion actions validated

### Legacy Intake

- Tag: `Intake criado — Royal Splash`
- Conversion ID: `18313732403`
- Conversion label: `FhpuCKSXqvQcELPC1ZxE`
- Google Ads action status at preflight: ENABLED
- Role: Primary
- Counting: ONE_PER_CLICK
- Kept active during overlap

### MCC Intake

- Tag: `Google Ads — MCC — RS | Intake criado`
- Conversion ID: `18470841900`
- Conversion label: `hsZICLmbrIUdEKzcyudE`
- Google Ads action: `RS | Intake criado`
- Owner: MCC `874-267-2466`
- Status at preflight: ENABLED
- Role: Primary
- Counting: ONE_PER_CLICK

### WhatsApp

- Tag: `Tag whatsapp`
- Conversion ID: `18313732403`
- Conversion label: `M0NcCMnYodgcELPC1ZxE`
- Trigger: `Disparo WhatsApp Click — Marketing granted`
- Active campaigns were verified as biddable on `SUBMIT_LEAD_FORM / WEBSITE`, not the WhatsApp CONTACT category.

### Legacy thank-you conversion

- Tag: `pagina de obrigado`
- Conversion ID: `18313732403`
- Conversion label: `onKLCOia09AcELPC1ZxE`
- State: PAUSED
- Trigger preserved only for history / rollback

## GTM routing validated

### Analytics

`Google tag — GA4 Royal Splash`

- ID: `G-20754X4KB7`
- Trigger: `CE — royal_measurement_consent — Analytics granted`

### Marketing

`Google tag — Ads Royal Splash legado`

- ID: `AW-18313732403`
- Trigger: `CE — royal_measurement_consent — Marketing granted`

`Google tag — MCC MTM GROUP`

- ID: `AW-18470841900`
- Trigger: `CE — royal_measurement_consent — Marketing granted`

`Vinculador de conversões`

- Trigger: `CE — royal_measurement_consent — Marketing granted`

### Intake

Both Intake conversion tags use:

`CE — intake_created — Marketing granted`

## Post-publish validation matrix

| Scenario | Result | Evidence |
| --- | --- | --- |
| No choice | PASS | GTM / Google measurement did not load before optional consent |
| Analytics only | PASS | Only `Google tag — GA4 Royal Splash` fired |
| Marketing only | PASS | Legacy Ads Google tag, MCC Google tag and Conversion Linker fired; GA4 did not |
| Analytics + Marketing | PASS | Both Analytics and Marketing infrastructure tags fired |
| Revoke all without reload | PASS | `analytics_consent=false`, `marketing_consent=false`; zero tags fired on revocation event |
| Real Intake | PASS | Exactly legacy Intake + MCC Intake conversion tags fired |
| `/obrigado` | PASS | Legacy thank-you conversion remained paused and did not participate in canonical Intake conversion |
| WhatsApp | PASS by routing audit | Tag remains isolated behind WhatsApp click + Marketing trigger |

## Consent revocation repair — production proof

A post-publish in-page transition from both categories granted to both denied produced:

```text
event = royal_measurement_consent
analytics_consent = false
marketing_consent = false
```

On that same event:

```text
Tags fired: none
8 tags not fired
```

This closes the prior stale GTM category-state blocker.

## Intake dataLayer privacy proof

Observed `intake_created` business payload:

```text
service_intent = POOL_CONSTRUCTION
acquisition_geography = RJ
experiment_id = HV-RJ-POOL-CONSTRUCTION
entry_surface = /lp/piscinas-rj
has_attachments = false
```

No customer name, phone number, email address, free-text requirement, or other submitted field value was present in the business payload.

GTM diagnostic metadata exposed references to HTML form element identifiers, but not the values entered into those fields.

## Browser network proof

### Legacy conversion

Observed real Google Ads conversion request:

```text
/pagead/conversion/18313732403/
en=conversion
label=FhpuCKSXqvQcELPC1ZxE
```

**Result:** NETWORK PASS.

### MCC conversion

Observed real Google Ads conversion request:

```text
/pagead/conversion/18470841900/
en=conversion
label=hsZICLmbrIUdEKzcyudE
```

**Result:** NETWORK PASS.

This closes the original reliability gap where Tag Assistant could report a tag firing without browser Network proof of the MCC conversion request.

## Release result

**FINAL VERDICT: PASS**

The following production gates were completed:

- audited site implementation merged;
- production Vercel deployment green;
- Google tag Ads / GA4 administrative split completed;
- audited GTM workspace published;
- consent matrix validated in browser;
- revoke-without-reload regression validated;
- real post-Atlas Intake event observed;
- legacy and MCC conversion tags fired exactly on `intake_created`;
- business dataLayer payload verified without submitted PII values;
- legacy and MCC Google Ads conversion network requests proven.

## Operational follow-up

Do not remove the legacy Intake conversion immediately. Keep overlap until the MCC action is visibly receiving normal production conversions in Google Ads and the observed volume is consistent with Atlas Intake volume.

Recommended follow-up:

1. Review Google Ads conversion diagnostics after propagation.
2. Compare Atlas Intake count vs legacy Intake vs MCC Intake for normal production traffic.
3. Mark or remove QA Intakes from commercial workflows.
4. Keep `pagina de obrigado` paused; do not restore it as canonical conversion.
5. Rename the residual administrative `Untitled tag` only when Google exposes a writable naming control; this is cleanup only.
6. Remove the legacy Intake conversion only in a separate, explicitly approved cleanup change after MCC stability is established.

## Guardrails retained

Do not as part of this RI:

- enable Enhanced Conversions;
- send lead PII into dataLayer;
- make WhatsApp the canonical Intake conversion;
- restore `/obrigado` as the primary conversion boundary;
- alter campaign bids, budgets or spend solely because of this cutover;
- remove the legacy conversion before MCC production stability is demonstrated.

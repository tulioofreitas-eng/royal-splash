/**
 * Provider-independent Site Engine contract for normalized lead ingress.
 *
 * This contract represents the information produced by Site conversion
 * surfaces before any external-provider adapter receives it.
 *
 * It does not define persistence, CRM workflow, analytics delivery,
 * provider payloads or Royal-specific infrastructure identifiers.
 */

export const SITE_LEAD_SCHEMA_VERSION = "site-lead.v1" as const;

export const LEAD_INGRESS_CHANNELS = [
  "site_form",
  "landing_form",
  "whatsapp",
] as const;

export type LeadIngressChannel =
  (typeof LEAD_INGRESS_CHANNELS)[number];

export const LEAD_CONSENT_STATES = [
  "granted",
  "not_recorded",
] as const;

export type LeadConsentState =
  (typeof LEAD_CONSENT_STATES)[number];

export interface SiteLeadContact {
  name: string;
  email?: string;
  phone?: string;
}

export interface SiteLeadInterest {
  serviceRef?: string;
  description?: string;
}

export interface SiteLeadAcquisitionContext {
  ingressChannel: LeadIngressChannel;
  source?: string;
  campaignRef?: string;
  pageRef?: string;
}

export interface SiteLeadConsent {
  state: LeadConsentState;
  policyRef?: string;
  capturedAt?: string;
}

export interface SiteLeadIngress {
  schemaVersion: typeof SITE_LEAD_SCHEMA_VERSION;
  contact: SiteLeadContact;
  city?: string;
  interest?: SiteLeadInterest;
  message?: string;
  acquisition: SiteLeadAcquisitionContext;
  consent: SiteLeadConsent;
}

export interface SiteLeadIngressPort {
  submit(lead: SiteLeadIngress): Promise<void>;
}

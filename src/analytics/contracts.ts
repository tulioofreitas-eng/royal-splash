/**
 * Provider-independent semantic analytics contracts for Site Engine.
 *
 * These contracts describe meaningful Site interactions before any
 * analytics provider, tag manager or delivery adapter receives them.
 *
 * They do not define GTM/GA4 payloads, provider event names, persistence,
 * runtime configuration, lead PII or Royal-specific infrastructure.
 */

export const SITE_ANALYTICS_SCHEMA_VERSION =
  "site-analytics.v1" as const;

export const SITE_ANALYTICS_EVENT_NAMES = [
  "page_viewed",
  "cta_activated",
  "lead_submitted",
] as const;

export type SiteAnalyticsEventName =
  (typeof SITE_ANALYTICS_EVENT_NAMES)[number];

export interface SiteAnalyticsContext {
  pageRef: string;
  route?: string;
  templateRef?: string;
  componentRef?: string;
}

export interface SiteAnalyticsEvent {
  schemaVersion: typeof SITE_ANALYTICS_SCHEMA_VERSION;
  eventName: SiteAnalyticsEventName;
  context: SiteAnalyticsContext;
  subjectRef?: string;
  channelRef?: string;
  campaignRef?: string;
}

export interface SiteAnalyticsPort {
  track(event: SiteAnalyticsEvent): Promise<void>;
}

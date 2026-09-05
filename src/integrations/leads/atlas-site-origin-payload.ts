import type {
  GrowthAttribution,
  SiteLeadIngress,
} from "../../domains/leads/contracts.ts";
import {
  InvalidGrowthAttributionError,
  normalizeGrowthAttribution,
} from "../../growth/attribution.ts";

export const ATLAS_SITE_INTAKE_SCHEMA_VERSION =
  "atlas-site-intake.v1" as const;

export const MAX_CONSENT_AGE_MS = 15 * 60 * 1000;
export const MAX_CONSENT_FUTURE_SKEW_MS = 60 * 1000;

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:-]+$/;
const PHONE_PATTERN = /^[0-9+().\s-]+$/;

export interface AtlasSiteIntakePayload {
  schemaVersion: typeof ATLAS_SITE_INTAKE_SCHEMA_VERSION;
  submission: {
    ref: string;
    channel: string;
    pageRef?: string;
  };
  contact: {
    name: string;
    email?: string;
    phone?: string;
  };
  location?: {
    city?: string;
  };
  request: {
    description: string;
  };
  consent: {
    state: "granted";
    policyRef: string;
    capturedAt: string;
  };
  attribution?: GrowthAttribution;
}

export type AtlasPayloadValidationReason =
  | "invalid_submission_ref"
  | "invalid_channel"
  | "invalid_page_ref"
  | "invalid_contact"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_location"
  | "missing_request"
  | "invalid_consent"
  | "stale_consent"
  | "invalid_attribution";

export class AtlasPayloadValidationError extends Error {
  readonly reason: AtlasPayloadValidationReason;

  constructor(reason: AtlasPayloadValidationReason) {
    super("Site lead is not eligible for Atlas ingress.");
    this.name = "AtlasPayloadValidationError";
    this.reason = reason;
  }
}

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

function isValidEmail(value: string): boolean {
  return value.length <= 320 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function descriptionFor(lead: SiteLeadIngress): string | undefined {
  const description = normalized(lead.interest?.description);
  const message = normalized(lead.message);
  const parts = [
    description,
    message ? `Mensagem: ${message}` : undefined,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join("\n") : undefined;
}

export function mapSiteLeadToAtlasPayload(
  lead: SiteLeadIngress,
  now: Date = new Date(),
): AtlasSiteIntakePayload {
  const submissionRef = normalized(lead.submissionRef);

  if (
    !submissionRef ||
    submissionRef.length < 16 ||
    submissionRef.length > 128 ||
    !REFERENCE_PATTERN.test(submissionRef)
  ) {
    throw new AtlasPayloadValidationError(
      "invalid_submission_ref",
    );
  }

  const channel = normalized(lead.acquisition.ingressChannel);

  if (
    !channel ||
    channel.length > 64 ||
    !REFERENCE_PATTERN.test(channel)
  ) {
    throw new AtlasPayloadValidationError("invalid_channel");
  }

  const pageRef = normalized(lead.acquisition.pageRef);

  if (pageRef && pageRef.length > 200) {
    throw new AtlasPayloadValidationError("invalid_page_ref");
  }

  const name = normalized(lead.contact.name);
  const email = normalized(lead.contact.email);
  const phone = normalized(lead.contact.phone);

  if (!name || name.length > 200 || (!email && !phone)) {
    throw new AtlasPayloadValidationError("invalid_contact");
  }

  if (email && !isValidEmail(email)) {
    throw new AtlasPayloadValidationError("invalid_email");
  }

  if (
    phone &&
    (
      phone.length < 7 ||
      phone.length > 40 ||
      !PHONE_PATTERN.test(phone)
    )
  ) {
    throw new AtlasPayloadValidationError("invalid_phone");
  }

  const description = descriptionFor(lead);

  if (!description || description.length > 4_000) {
    throw new AtlasPayloadValidationError("missing_request");
  }

  const city = normalized(lead.city);

  if (city && city.length > 120) {
    throw new AtlasPayloadValidationError("invalid_location");
  }

  if (lead.consent.state !== "granted") {
    throw new AtlasPayloadValidationError("invalid_consent");
  }

  const policyRef = normalized(lead.consent.policyRef);
  const capturedAt = normalized(lead.consent.capturedAt);

  if (!policyRef || !capturedAt) {
    throw new AtlasPayloadValidationError("invalid_consent");
  }

  const capturedAtMs = Date.parse(capturedAt);
  const ageMs = now.getTime() - capturedAtMs;

  if (
    !Number.isFinite(capturedAtMs) ||
    ageMs > MAX_CONSENT_AGE_MS ||
    ageMs < -MAX_CONSENT_FUTURE_SKEW_MS
  ) {
    throw new AtlasPayloadValidationError("stale_consent");
  }

  let attribution: GrowthAttribution | undefined;

  try {
    attribution = normalizeGrowthAttribution(
      lead.attribution,
      now,
    );
  } catch (error) {
    if (error instanceof InvalidGrowthAttributionError) {
      throw new AtlasPayloadValidationError("invalid_attribution");
    }

    throw error;
  }

  return {
    schemaVersion: ATLAS_SITE_INTAKE_SCHEMA_VERSION,
    submission: {
      ref: submissionRef,
      channel,
      ...(pageRef ? { pageRef } : {}),
    },
    contact: {
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
    ...(city ? { location: { city } } : {}),
    request: {
      description,
    },
    consent: {
      state: "granted",
      policyRef,
      capturedAt,
    },
    ...(attribution ? { attribution } : {}),
  };
}

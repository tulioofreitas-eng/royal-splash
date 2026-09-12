import {
  normalizeConversionOrigin,
  normalizeConversionPageRef,
} from "../../conversion/origin.ts";
import {
  SITE_LEAD_SCHEMA_VERSION,
  ROYAL_PRIVACY_R1,
  type GrowthAttribution,
  type SiteLeadIngress,
} from "../../domains/leads/contracts.ts";
import {
  InvalidGrowthAttributionError,
  normalizeGrowthAttribution,
} from "../../growth/attribution.ts";

export interface SiteLeadRequestPayload {
  submissionRef?: unknown;
  consentCapturedAt?: unknown;
  projectContext?: unknown;
  projectNeed?: unknown;
  city?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  consent?: unknown;
  source?: unknown;
  pageRef?: unknown;
  message?: unknown;
  attribution?: unknown;
}

export class InvalidSiteLeadSubmissionError extends Error {
  constructor() {
    super("Invalid site lead submission.");
    this.name = "InvalidSiteLeadSubmissionError";
  }
}

function normalizedText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const result = value.trim();
  return result || undefined;
}

function isClearlyValidEmail(value: string): boolean {
  const separatorIndex = value.indexOf("@");

  return (
    !/\s/.test(value) &&
    separatorIndex > 0 &&
    separatorIndex === value.lastIndexOf("@") &&
    separatorIndex < value.length - 1
  );
}

function contextLabel(value: string): string | undefined {
  if (value === "residencial") {
    return "Residencial";
  }

  if (value === "corporativo_institucional") {
    return "Corporativo / Institucional";
  }

  return undefined;
}

export function normalizeSiteLeadRequest(
  body: SiteLeadRequestPayload,
): SiteLeadIngress {
  const submissionRef = normalizedText(body.submissionRef);
  const consentCapturedAt = normalizedText(
    body.consentCapturedAt,
  );
  const projectContext = normalizedText(body.projectContext);
  const projectNeed = normalizedText(body.projectNeed);
  const city = normalizedText(body.city);
  const name = normalizedText(body.name);
  const email = normalizedText(body.email);
  const phone = normalizedText(body.phone);
  const message = normalizedText(body.message);
  const context = projectContext
    ? contextLabel(projectContext)
    : undefined;

  if (
    !submissionRef ||
    !consentCapturedAt ||
    !context ||
    !city ||
    !name ||
    (!email && !phone) ||
    (email && !isClearlyValidEmail(email)) ||
    body.consent !== true
  ) {
    throw new InvalidSiteLeadSubmissionError();
  }

  const conversionOrigin = normalizeConversionOrigin({
    source: body.source,
    pageRef: body.pageRef,
  });
  const pageRef =
    normalizeConversionPageRef(body.pageRef) ??
    "/inicie-seu-projeto";
  let attribution: GrowthAttribution | undefined;

  try {
    attribution = normalizeGrowthAttribution(body.attribution);
  } catch (error) {
    if (error instanceof InvalidGrowthAttributionError) {
      throw new InvalidSiteLeadSubmissionError();
    }

    throw error;
  }

  const serviceRefByPage: Record<string, string> = {
    "/lp/reforma-rj": "reforma_alvenaria",
    "/lp/piscinas-rj": "construcao",
    "/lp/fibra-rj": "revitalizacao_fibra",
  };

  const serviceRef = serviceRefByPage[body.pageRef as string];

  const buildDescription = (context: string, projectNeed: string | undefined): string => {
    const parts = [`Contexto: ${context}`];
    if (projectNeed) {
      parts.push(`Necessidade: ${projectNeed}`);
    }
    return parts.join(". ");
  };

  return {
    schemaVersion: SITE_LEAD_SCHEMA_VERSION,
    submissionRef,
    contact: {
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
    city,
    interest: {
      ...(serviceRef ? { serviceRef } : {}),
      description: buildDescription(context, projectNeed),
    },
    acquisition: {
      ingressChannel: "site_form",
      ...(conversionOrigin.source
        ? { source: conversionOrigin.source }
        : {}),
      pageRef,
    },
    ...(message ? { message } : {}),
    ...(attribution ? { attribution } : {}),
    consent: {
      state: "granted",
      policyRef: ROYAL_PRIVACY_R1,
      capturedAt: consentCapturedAt,
    },
  };
}

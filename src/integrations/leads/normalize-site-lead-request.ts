import {
  normalizeConversionOrigin,
} from "../../conversion/origin.ts";
import {
  SITE_LEAD_SCHEMA_VERSION,
  ROYAL_PRIVACY_R1,
  type SiteLeadIngress,
} from "../../domains/leads/contracts.ts";

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
  const context = projectContext
    ? contextLabel(projectContext)
    : undefined;

  if (
    !submissionRef ||
    !consentCapturedAt ||
    !context ||
    !city ||
    !projectNeed ||
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
      description:
        `Contexto: ${context}. Necessidade: ${projectNeed}`,
    },
    acquisition: {
      ingressChannel: "site_form",
      ...(conversionOrigin.source
        ? { source: conversionOrigin.source }
        : {}),
      pageRef:
        conversionOrigin.pageRef ?? "/inicie-seu-projeto",
    },
    consent: {
      state: "granted",
      policyRef: ROYAL_PRIVACY_R1,
      capturedAt: consentCapturedAt,
    },
  };
}

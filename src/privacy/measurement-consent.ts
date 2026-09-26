export const MEASUREMENT_CONSENT_STORAGE_KEY =
  "royal_measurement_consent.v1" as const;

export const MEASUREMENT_CONSENT_VERSION = 1 as const;

export type GoogleConsentValue = "granted" | "denied";

export interface MeasurementConsentChoice {
  version: typeof MEASUREMENT_CONSENT_VERSION;
  analytics: boolean;
  marketing: boolean;
}

export interface GoogleConsentState {
  analytics_storage: GoogleConsentValue;
  ad_storage: GoogleConsentValue;
  ad_user_data: GoogleConsentValue;
  ad_personalization: GoogleConsentValue;
}

export const DEFAULT_MEASUREMENT_CONSENT: MeasurementConsentChoice = {
  version: MEASUREMENT_CONSENT_VERSION,
  analytics: false,
  marketing: false,
};

export function createMeasurementConsentChoice(
  input: Pick<MeasurementConsentChoice, "analytics" | "marketing">,
): MeasurementConsentChoice {
  return {
    version: MEASUREMENT_CONSENT_VERSION,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
  };
}

export function parseStoredMeasurementConsent(
  serialized: string | null | undefined,
): MeasurementConsentChoice | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return undefined;
    }

    const value = parsed as Record<string, unknown>;

    if (
      value.version !== MEASUREMENT_CONSENT_VERSION ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean"
    ) {
      return undefined;
    }

    return createMeasurementConsentChoice({
      analytics: value.analytics,
      marketing: value.marketing,
    });
  } catch {
    return undefined;
  }
}

export function toGoogleConsentState(
  choice: MeasurementConsentChoice | undefined,
): GoogleConsentState {
  const effective = choice ?? DEFAULT_MEASUREMENT_CONSENT;
  const analytics: GoogleConsentValue =
    effective.analytics ? "granted" : "denied";
  const marketing: GoogleConsentValue =
    effective.marketing ? "granted" : "denied";

  return {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  };
}

export function shouldLoadMeasurementContainer(
  choice: MeasurementConsentChoice | undefined,
): boolean {
  return choice?.analytics === true || choice?.marketing === true;
}

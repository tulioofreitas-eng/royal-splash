interface MeasurementConsentRuntimeWindow extends Window {
  __royalMeasurementConsent?: {
    get?: () => { marketing?: boolean } | null;
  };
}

/** Marketing permission is separate from contact-processing consent. */
export function isMarketingMeasurementAllowed(browserWindow: Window): boolean {
  try {
    const w = browserWindow as MeasurementConsentRuntimeWindow;
    return w.__royalMeasurementConsent?.get?.()?.marketing === true;
  } catch {
    return false;
  }
}

export function getMeasurementRequestHeaders(
  browserWindow: Window,
): Record<string, string> {
  return isMarketingMeasurementAllowed(browserWindow)
    ? { "X-Royal-Marketing-Consent": "granted" }
    : {};
}

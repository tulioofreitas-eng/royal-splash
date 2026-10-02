interface MeasurementConsentRuntimeWindow extends Window {
  __royalMeasurementConsent?: {
    get?: () => {
      marketing?: boolean;
    } | null;
  };
}

export function getMeasurementRequestHeaders(
  browserWindow: Window,
): Record<string, string> {
  const w = browserWindow as MeasurementConsentRuntimeWindow;
  const marketingGranted =
    w.__royalMeasurementConsent?.get?.()?.marketing === true;

  return marketingGranted
    ? { "X-Royal-Marketing-Consent": "granted" }
    : {};
}

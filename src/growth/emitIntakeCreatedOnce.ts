/**
 * Emit the canonical post-persistence intake-created browser signal once per
 * submissionRef. Google/GTM delivery is consent-aware in production.
 *
 * The provider-independent CustomEvent is always dispatched after canonical
 * success. The GTM dataLayer event is emitted only when Marketing consent is
 * granted when the production consent runtime is present.
 *
 * In preview/test environments the consent runtime is intentionally absent
 * because production analytics is disabled; dataLayer emission remains
 * available there for deterministic contract verification.
 */

const emittedRefs = new Set<string>();

const getConversionEmittedKey = (ref: string): string =>
  `intake_created_emitted_${ref}`;

const hasConversionBeenEmitted = (ref: string): boolean => {
  if (emittedRefs.has(ref)) return true;

  try {
    return sessionStorage.getItem(
      getConversionEmittedKey(ref),
    ) === "true";
  } catch {
    return false;
  }
};

const markConversionAsEmitted = (ref: string): void => {
  emittedRefs.add(ref);

  try {
    sessionStorage.setItem(
      getConversionEmittedKey(ref),
      "true",
    );
  } catch {
    // In-memory Set remains the fallback when sessionStorage is unavailable.
  }
};

interface IntakeCreatedEvent {
  service_intent: string;
  acquisition_geography: string;
  experiment_id: string;
  entry_surface: string;
  has_attachments?: boolean;
}

interface RoyalMeasurementConsentRuntime {
  get?: () => {
    marketing?: boolean;
  } | null;
}

interface IntakeCreatedWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
  __royalMeasurementConsent?: RoyalMeasurementConsentRuntime;
}

function marketingMeasurementAllowed(
  browserWindow: IntakeCreatedWindow,
): boolean {
  const runtime =
    browserWindow.__royalMeasurementConsent;

  // Preview/test intentionally does not install the production consent runtime.
  if (!runtime) {
    return true;
  }

  return runtime.get?.()?.marketing === true;
}

export const emitIntakeCreatedOnce = (
  submissionRef: string,
  event: IntakeCreatedEvent,
): void => {
  if (hasConversionBeenEmitted(submissionRef)) {
    return;
  }

  const w = window as IntakeCreatedWindow;

  w.dispatchEvent(
    new CustomEvent(
      "royal:intake-created",
      {
        detail: {
          submissionRef,
          ...event,
        },
      },
    ),
  );

  if (marketingMeasurementAllowed(w)) {
    w.dataLayer = w.dataLayer || [];

    w.dataLayer.push({
      event: "intake_created",
      ...event,
    });
  }

  markConversionAsEmitted(submissionRef);
};

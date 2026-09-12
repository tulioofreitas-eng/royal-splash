/**
 * Emit intake_created event once per submissionRef with fallback dedup.
 * In-memory Set is required fallback when sessionStorage is unavailable.
 */

const emittedRefs = new Set<string>();

const getConversionEmittedKey = (ref: string): string => `intake_created_emitted_${ref}`;

const hasConversionBeenEmitted = (ref: string): boolean => {
  if (emittedRefs.has(ref)) return true;
  try {
    return sessionStorage.getItem(getConversionEmittedKey(ref)) === "true";
  } catch {
    return false;
  }
};

const markConversionAsEmitted = (ref: string): void => {
  emittedRefs.add(ref);
  try {
    sessionStorage.setItem(getConversionEmittedKey(ref), "true");
  } catch {
    // Silently fail if sessionStorage is unavailable; in-memory Set provides fallback
  }
};

interface IntakeCreatedEvent {
  service_intent: string;
  acquisition_geography: string;
  experiment_id: string;
  entry_surface: string;
}

export const emitIntakeCreatedOnce = (submissionRef: string, event: IntakeCreatedEvent): void => {
  if (hasConversionBeenEmitted(submissionRef)) return;

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "intake_created",
    ...event
  });

  markConversionAsEmitted(submissionRef);
};

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

export const emitIntakeCreatedOnce = (submissionRef: string): void => {
  if (hasConversionBeenEmitted(submissionRef)) return;

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "intake_created",
    service_intent: "FIBERGLASS_POOL_RESTORATION",
    acquisition_geography: "RJ",
    experiment_id: "HV-RJ-FIBERGLASS-RESTORATION",
    entry_surface: "/lp/fibra-rj"
  });

  markConversionAsEmitted(submissionRef);
};

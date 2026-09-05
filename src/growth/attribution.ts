import {
  GROWTH_MEDIUM_ALLOW,
  GROWTH_SOURCE_ALLOW,
  type GrowthAttribution,
  type GrowthFirstTouch,
  type GrowthMedium,
  type GrowthSource,
  type GrowthSubmissionTouch,
} from "../domains/leads/contracts.ts";

export const GROWTH_FIRST_TOUCH_STORAGE_KEY =
  "royal_growth_first_touch.v1" as const;
export const GROWTH_FIRST_TOUCH_STORAGE_VERSION = 1 as const;
export const GROWTH_FIRST_TOUCH_RETENTION_MS =
  30 * 24 * 60 * 60 * 1_000;

const CAMPAIGN_REF_PATTERN = /^[A-Za-z0-9_.:-]+$/;
const REFERRER_HOST_PATTERN =
  /^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const CAMPAIGN_REF_MAX = 200;
const PAGE_REF_MAX = 200;
const REFERRER_HOST_MAX = 253;

interface GrowthFirstTouchStorageRecord {
  version: typeof GROWTH_FIRST_TOUCH_STORAGE_VERSION;
  firstTouch: GrowthFirstTouch;
}

export interface GrowthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface FirstTouchObservation {
  url: URL;
  referrer?: string;
  now?: Date;
}

export class InvalidGrowthAttributionError extends Error {
  constructor() {
    super("Invalid Growth attribution.");
    this.name = "InvalidGrowthAttributionError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function optionalText(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new InvalidGrowthAttributionError();
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    throw new InvalidGrowthAttributionError();
  }

  return normalized;
}

function normalizeCampaignRef(value: unknown): string | undefined {
  const normalized = optionalText(value, CAMPAIGN_REF_MAX);

  if (normalized && !CAMPAIGN_REF_PATTERN.test(normalized)) {
    throw new InvalidGrowthAttributionError();
  }

  return normalized;
}

function normalizePathRef(value: unknown): string | undefined {
  const normalized = optionalText(value, PAGE_REF_MAX);

  if (
    normalized &&
    (normalized.includes("?") || normalized.includes("://"))
  ) {
    throw new InvalidGrowthAttributionError();
  }

  return normalized;
}

function normalizeReferrerHost(value: unknown): string | undefined {
  const normalized = optionalText(value, REFERRER_HOST_MAX);

  if (normalized && !REFERRER_HOST_PATTERN.test(normalized)) {
    throw new InvalidGrowthAttributionError();
  }

  return normalized;
}

function normalizeMedium(value: unknown): GrowthMedium | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    !GROWTH_MEDIUM_ALLOW.includes(value as GrowthMedium)
  ) {
    throw new InvalidGrowthAttributionError();
  }

  return value as GrowthMedium;
}

function normalizeSource(value: unknown): GrowthSource | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    !GROWTH_SOURCE_ALLOW.includes(value as GrowthSource)
  ) {
    throw new InvalidGrowthAttributionError();
  }

  return value as GrowthSource;
}

function normalizeCapturedAt(
  value: unknown,
  now: Date,
  enforceRetention: boolean,
): string {
  if (typeof value !== "string") {
    throw new InvalidGrowthAttributionError();
  }

  const capturedAtMs = Date.parse(value);
  const ageMs = now.getTime() - capturedAtMs;

  if (
    !Number.isFinite(capturedAtMs) ||
    (enforceRetention &&
      (ageMs < 0 || ageMs > GROWTH_FIRST_TOUCH_RETENTION_MS))
  ) {
    throw new InvalidGrowthAttributionError();
  }

  return value;
}

function normalizeFirstTouch(
  value: unknown,
  now: Date,
  enforceRetention: boolean,
): GrowthFirstTouch {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "campaignRef",
      "medium",
      "source",
      "landingPageRef",
      "referrerHost",
      "capturedAt",
    ])
  ) {
    throw new InvalidGrowthAttributionError();
  }

  const capturedAt = normalizeCapturedAt(
    value.capturedAt,
    now,
    enforceRetention,
  );
  const campaignRef = normalizeCampaignRef(value.campaignRef);
  const medium = normalizeMedium(value.medium);
  const source = normalizeSource(value.source);
  const landingPageRef = normalizePathRef(value.landingPageRef);
  const referrerHost = normalizeReferrerHost(value.referrerHost);

  return {
    capturedAt,
    ...(campaignRef ? { campaignRef } : {}),
    ...(medium ? { medium } : {}),
    ...(source ? { source } : {}),
    ...(landingPageRef ? { landingPageRef } : {}),
    ...(referrerHost ? { referrerHost } : {}),
  };
}

function normalizeSubmissionTouch(
  value: unknown,
): GrowthSubmissionTouch {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "campaignRef",
      "medium",
      "source",
      "pageRef",
    ])
  ) {
    throw new InvalidGrowthAttributionError();
  }

  const campaignRef = normalizeCampaignRef(value.campaignRef);
  const medium = normalizeMedium(value.medium);
  const source = normalizeSource(value.source);
  const pageRef = normalizePathRef(value.pageRef);

  if (!campaignRef && !medium && !source && !pageRef) {
    throw new InvalidGrowthAttributionError();
  }

  return {
    ...(campaignRef ? { campaignRef } : {}),
    ...(medium ? { medium } : {}),
    ...(source ? { source } : {}),
    ...(pageRef ? { pageRef } : {}),
  };
}

export function normalizeGrowthAttribution(
  value: unknown,
  now: Date = new Date(),
): GrowthAttribution | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["firstTouch", "submissionTouch"])
  ) {
    throw new InvalidGrowthAttributionError();
  }

  const firstTouch = value.firstTouch === undefined
    ? undefined
    : normalizeFirstTouch(value.firstTouch, now, true);
  const submissionTouch = value.submissionTouch === undefined
    ? undefined
    : normalizeSubmissionTouch(value.submissionTouch);

  if (!firstTouch && !submissionTouch) {
    throw new InvalidGrowthAttributionError();
  }

  return {
    ...(firstTouch ? { firstTouch } : {}),
    ...(submissionTouch ? { submissionTouch } : {}),
  };
}

function normalizedUrlMedium(value: string | null): GrowthMedium | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized &&
    GROWTH_MEDIUM_ALLOW.includes(normalized as GrowthMedium)
    ? normalized as GrowthMedium
    : undefined;
}

function normalizedUrlSource(value: string | null): GrowthSource | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized &&
    GROWTH_SOURCE_ALLOW.includes(normalized as GrowthSource)
    ? normalized as GrowthSource
    : undefined;
}

function normalizedUrlCampaign(value: string | null): string | undefined {
  try {
    return normalizeCampaignRef(value ?? undefined);
  } catch {
    return undefined;
  }
}

function normalizedUrlPath(value: string): string | undefined {
  try {
    return normalizePathRef(value);
  } catch {
    return undefined;
  }
}

function externalReferrerHost(
  referrer: string | undefined,
  currentUrl: URL,
): string | undefined {
  if (!referrer) {
    return undefined;
  }

  try {
    const referrerUrl = new URL(referrer);

    if (referrerUrl.hostname === currentUrl.hostname) {
      return undefined;
    }

    return normalizeReferrerHost(referrerUrl.hostname);
  } catch {
    return undefined;
  }
}

export function observeFirstTouch(
  observation: FirstTouchObservation,
): GrowthFirstTouch {
  const { url, referrer } = observation;
  const now = observation.now ?? new Date();
  const campaignRef = normalizedUrlCampaign(
    url.searchParams.get("utm_campaign"),
  );
  const medium = normalizedUrlMedium(
    url.searchParams.get("utm_medium"),
  );
  const source = normalizedUrlSource(
    url.searchParams.get("utm_source"),
  );
  const landingPageRef = normalizedUrlPath(url.pathname);
  const referrerHost = externalReferrerHost(referrer, url);

  return {
    capturedAt: now.toISOString(),
    ...(campaignRef ? { campaignRef } : {}),
    ...(medium ? { medium } : {}),
    ...(source ? { source } : {}),
    ...(landingPageRef ? { landingPageRef } : {}),
    ...(referrerHost ? { referrerHost } : {}),
  };
}

export function observeSubmissionTouch(
  url: URL,
): GrowthSubmissionTouch | undefined {
  const campaignRef = normalizedUrlCampaign(
    url.searchParams.get("utm_campaign"),
  );
  const medium = normalizedUrlMedium(
    url.searchParams.get("utm_medium"),
  );
  const source = normalizedUrlSource(
    url.searchParams.get("utm_source"),
  );
  const pageRef = normalizedUrlPath(url.pathname);

  if (!campaignRef && !medium && !source && !pageRef) {
    return undefined;
  }

  return {
    ...(campaignRef ? { campaignRef } : {}),
    ...(medium ? { medium } : {}),
    ...(source ? { source } : {}),
    ...(pageRef ? { pageRef } : {}),
  };
}

export function readPersistedFirstTouch(
  storage: GrowthStorage | undefined,
  now: Date = new Date(),
): GrowthFirstTouch | undefined {
  if (!storage) {
    return undefined;
  }

  try {
    const serialized = storage.getItem(
      GROWTH_FIRST_TOUCH_STORAGE_KEY,
    );

    if (!serialized) {
      return undefined;
    }

    const record = JSON.parse(serialized) as unknown;

    if (
      !isRecord(record) ||
      !hasOnlyKeys(record, ["version", "firstTouch"]) ||
      record.version !== GROWTH_FIRST_TOUCH_STORAGE_VERSION
    ) {
      return undefined;
    }

    return normalizeFirstTouch(record.firstTouch, now, true);
  } catch {
    return undefined;
  }
}

export function persistFirstTouchAfterConsent(
  storage: GrowthStorage | undefined,
  candidate: GrowthFirstTouch | undefined,
  now: Date = new Date(),
): GrowthFirstTouch | undefined {
  const existing = readPersistedFirstTouch(storage, now);

  if (existing) {
    return existing;
  }

  if (!storage || !candidate) {
    return undefined;
  }

  try {
    const normalized = normalizeFirstTouch(candidate, now, true);
    const record: GrowthFirstTouchStorageRecord = {
      version: GROWTH_FIRST_TOUCH_STORAGE_VERSION,
      firstTouch: normalized,
    };

    storage.setItem(
      GROWTH_FIRST_TOUCH_STORAGE_KEY,
      JSON.stringify(record),
    );

    return readPersistedFirstTouch(storage, now);
  } catch {
    return undefined;
  }
}

export function composeGrowthAttribution(
  firstTouch: GrowthFirstTouch | undefined,
  submissionTouch: GrowthSubmissionTouch | undefined,
): GrowthAttribution | undefined {
  if (!firstTouch && !submissionTouch) {
    return undefined;
  }

  return {
    ...(firstTouch ? { firstTouch } : {}),
    ...(submissionTouch ? { submissionTouch } : {}),
  };
}

export interface BrowserGrowthAttributionRuntime {
  observe(observation: FirstTouchObservation): GrowthFirstTouch;
  getObservedFirstTouch(): GrowthFirstTouch | undefined;
  readPersisted(now?: Date): GrowthFirstTouch | undefined;
  persistAfterConsent(now?: Date): GrowthFirstTouch | undefined;
}

export function createBrowserGrowthAttributionRuntime(
  storage: GrowthStorage | undefined,
): BrowserGrowthAttributionRuntime {
  let observedFirstTouch: GrowthFirstTouch | undefined;

  return {
    observe(observation) {
      observedFirstTouch ??= observeFirstTouch(observation);
      return observedFirstTouch;
    },
    getObservedFirstTouch() {
      return observedFirstTouch;
    },
    readPersisted(now = new Date()) {
      return readPersistedFirstTouch(storage, now);
    },
    persistAfterConsent(now = new Date()) {
      return persistFirstTouchAfterConsent(
        storage,
        observedFirstTouch,
        now,
      );
    },
  };
}

interface GrowthRuntimeWindow extends Window {
  __royalGrowthAttribution?: BrowserGrowthAttributionRuntime;
}

export function getBrowserGrowthAttributionRuntime(
  browserWindow: Window,
): BrowserGrowthAttributionRuntime {
  const runtimeWindow = browserWindow as GrowthRuntimeWindow;

  if (!runtimeWindow.__royalGrowthAttribution) {
    let storage: Storage | undefined;

    try {
      storage = browserWindow.localStorage;
    } catch {
      storage = undefined;
    }

    runtimeWindow.__royalGrowthAttribution =
      createBrowserGrowthAttributionRuntime(storage);
  }

  return runtimeWindow.__royalGrowthAttribution;
}

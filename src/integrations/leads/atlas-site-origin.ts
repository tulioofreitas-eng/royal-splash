import type {
  SiteLeadIngress,
  SiteLeadIngressPort,
} from "../../domains/leads/contracts.ts";
import type {
  AtlasSiteOriginConfig,
} from "../../safety/atlas-site-origin-config.ts";
import {
  mapSiteLeadToAtlasPayload,
} from "./atlas-site-origin-payload.ts";

export const ATLAS_PUBLIC_ERROR_CODES = [
  "INVALID_REQUEST",
  "UNAUTHORIZED_CALLER",
  "INVALID_CONSENT",
  "UNKNOWN_SERVICE",
  "SERVICE_UNAVAILABLE",
  "RATE_LIMITED",
  "TEMPORARY_FAILURE",
  "INTERNAL_FAILURE",
] as const;

export type AtlasPublicErrorCode =
  (typeof ATLAS_PUBLIC_ERROR_CODES)[number];

export type SiteLeadVisitorErrorCode =
  | "invalid_submission"
  | "invalid_consent"
  | "temporarily_unavailable"
  | "submission_failed";

export interface AtlasSiteOriginLogRecord {
  submissionRef: string;
  channel: string;
  pageRef?: string;
  resultCode: string;
  caseId?: string;
  replay?: boolean;
  duration: number;
}

export class AtlasSiteOriginError extends Error {
  readonly resultCode: string;
  readonly visitorCode: SiteLeadVisitorErrorCode;
  readonly visitorStatus: number;
  readonly retryable: boolean;

  constructor(options: {
    resultCode: string;
    visitorCode: SiteLeadVisitorErrorCode;
    visitorStatus: number;
    retryable: boolean;
  }) {
    super("Site lead delivery failed.");
    this.name = "AtlasSiteOriginError";
    this.resultCode = options.resultCode;
    this.visitorCode = options.visitorCode;
    this.visitorStatus = options.visitorStatus;
    this.retryable = options.retryable;
  }
}

export function mapAtlasPublicError(
  code: AtlasPublicErrorCode,
): AtlasSiteOriginError {
  switch (code) {
    case "INVALID_REQUEST":
    case "UNKNOWN_SERVICE":
      return new AtlasSiteOriginError({
        resultCode: code,
        visitorCode: "invalid_submission",
        visitorStatus: 400,
        retryable: false,
      });
    case "INVALID_CONSENT":
      return new AtlasSiteOriginError({
        resultCode: code,
        visitorCode: "invalid_consent",
        visitorStatus: 400,
        retryable: false,
      });
    case "UNAUTHORIZED_CALLER":
      return new AtlasSiteOriginError({
        resultCode: code,
        visitorCode: "submission_failed",
        visitorStatus: 502,
        retryable: false,
      });
    case "SERVICE_UNAVAILABLE":
    case "RATE_LIMITED":
    case "TEMPORARY_FAILURE":
    case "INTERNAL_FAILURE":
      return new AtlasSiteOriginError({
        resultCode: code,
        visitorCode: "temporarily_unavailable",
        visitorStatus: 503,
        retryable: true,
      });
  }
}

interface AtlasSiteOriginAdapterDependencies {
  fetch?: typeof fetch;
  sleep?: (delayMs: number) => Promise<void>;
  now?: () => number;
  createTimeoutSignal?: (timeoutMs: number) => AbortSignal;
  log?: (record: AtlasSiteOriginLogRecord) => void;
}

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function defaultLog(record: AtlasSiteOriginLogRecord): void {
  console.info("atlas_site_origin", record);
}

function isAtlasPublicErrorCode(
  value: unknown,
): value is AtlasPublicErrorCode {
  return (
    typeof value === "string" &&
    ATLAS_PUBLIC_ERROR_CODES.some((code) => code === value)
  );
}

function publicErrorCodeFrom(body: unknown): AtlasPublicErrorCode | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const record = body as Record<string, unknown>;

  if (isAtlasPublicErrorCode(record.code)) {
    return record.code;
  }

  if (isAtlasPublicErrorCode(record.error)) {
    return record.error;
  }

  if (record.error && typeof record.error === "object") {
    const nested = record.error as Record<string, unknown>;

    if (isAtlasPublicErrorCode(nested.code)) {
      return nested.code;
    }
  }

  return undefined;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function safeCaseId(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const caseId = (body as Record<string, unknown>).caseId;

  if (
    typeof caseId === "string" &&
    caseId.length >= 1 &&
    caseId.length <= 128 &&
    /^[A-Za-z0-9_.:-]+$/.test(caseId)
  ) {
    return caseId;
  }

  return undefined;
}

function replayFrom(body: unknown): boolean | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const replay = (body as Record<string, unknown>).replay;
  return typeof replay === "boolean" ? replay : undefined;
}

function fallbackErrorForStatus(status: number): AtlasSiteOriginError {
  if (status === 401) {
    return mapAtlasPublicError("UNAUTHORIZED_CALLER");
  }

  if (status === 429) {
    return mapAtlasPublicError("RATE_LIMITED");
  }

  if (status === 400 || status === 422) {
    return mapAtlasPublicError("INVALID_REQUEST");
  }

  if (status === 500) {
    return mapAtlasPublicError("INTERNAL_FAILURE");
  }

  if (status === 503) {
    return mapAtlasPublicError("SERVICE_UNAVAILABLE");
  }

  return new AtlasSiteOriginError({
    resultCode: "UNEXPECTED_RESPONSE",
    visitorCode: "submission_failed",
    visitorStatus: 502,
    retryable: false,
  });
}

function boundedRetryDelay(
  response: Response | undefined,
  nowMs: number,
  maxDelayMs: number,
): number {
  if (response?.status !== 429) {
    return Math.min(200, maxDelayMs);
  }

  const retryAfter = response.headers.get("retry-after")?.trim();

  if (!retryAfter) {
    return Math.min(200, maxDelayMs);
  }

  const seconds = Number(retryAfter);
  const requestedDelay = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(retryAfter) - nowMs;

  if (!Number.isFinite(requestedDelay)) {
    return Math.min(200, maxDelayMs);
  }

  return Math.max(0, Math.min(requestedDelay, maxDelayMs));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

export class AtlasSiteOriginAdapter implements SiteLeadIngressPort {
  private readonly config: AtlasSiteOriginConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (delayMs: number) => Promise<void>;
  private readonly now: () => number;
  private readonly createTimeoutSignal:
    (timeoutMs: number) => AbortSignal;
  private readonly log: (record: AtlasSiteOriginLogRecord) => void;

  constructor(
    config: AtlasSiteOriginConfig,
    dependencies: AtlasSiteOriginAdapterDependencies = {},
  ) {
    this.config = config;
    this.fetchImpl = dependencies.fetch ?? globalThis.fetch;
    this.sleep = dependencies.sleep ?? defaultSleep;
    this.now = dependencies.now ?? Date.now;
    this.createTimeoutSignal =
      dependencies.createTimeoutSignal ??
      ((timeoutMs) => AbortSignal.timeout(timeoutMs));
    this.log = dependencies.log ?? defaultLog;
  }

  async submit(lead: SiteLeadIngress): Promise<void> {
    const startedAt = this.now();
    const payload = mapSiteLeadToAtlasPayload(
      lead,
      new Date(startedAt),
    );
    const serializedPayload = JSON.stringify(payload);
    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${this.config.token}`,
      "idempotency-key": payload.submission.ref,
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response | undefined;

      try {
        response = await this.fetchImpl(this.config.endpoint, {
          method: "POST",
          headers,
          body: serializedPayload,
          signal: this.createTimeoutSignal(this.config.timeoutMs),
        });
      } catch {
        if (attempt === 0) {
          await this.sleep(
            boundedRetryDelay(
              undefined,
              this.now(),
              this.config.maxRetryDelayMs,
            ),
          );
          continue;
        }

        const error = mapAtlasPublicError("TEMPORARY_FAILURE");
        this.logFailure(payload, error, startedAt);
        throw error;
      }

      if (response.status === 200 || response.status === 201) {
        const body = await responseJson(response);
        this.log({
          submissionRef: payload.submission.ref,
          channel: payload.submission.channel,
          ...(payload.submission.pageRef
            ? { pageRef: payload.submission.pageRef }
            : {}),
          resultCode: response.status === 201 ? "CREATED" : "REPLAY",
          ...(safeCaseId(body) ? { caseId: safeCaseId(body) } : {}),
          ...(replayFrom(body) !== undefined
            ? { replay: replayFrom(body) }
            : {}),
          duration: Math.max(0, this.now() - startedAt),
        });
        return;
      }

      if (attempt === 0 && isRetryableStatus(response.status)) {
        await response.body?.cancel();
        await this.sleep(
          boundedRetryDelay(
            response,
            this.now(),
            this.config.maxRetryDelayMs,
          ),
        );
        continue;
      }

      const body = await responseJson(response);
      const publicCode = publicErrorCodeFrom(body);
      const error = publicCode
        ? mapAtlasPublicError(publicCode)
        : fallbackErrorForStatus(response.status);
      this.logFailure(payload, error, startedAt);
      throw error;
    }
  }

  private logFailure(
    payload: ReturnType<typeof mapSiteLeadToAtlasPayload>,
    error: AtlasSiteOriginError,
    startedAt: number,
  ): void {
    this.log({
      submissionRef: payload.submission.ref,
      channel: payload.submission.channel,
      ...(payload.submission.pageRef
        ? { pageRef: payload.submission.pageRef }
        : {}),
      resultCode: error.resultCode,
      duration: Math.max(0, this.now() - startedAt),
    });
  }
}

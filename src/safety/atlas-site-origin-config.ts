import type {
  EnvironmentContract,
} from "./environment.ts";

export const ATLAS_SITE_ORIGIN_PATH =
  "/api/intake/site-origin" as const;

export interface AtlasSiteOriginConfig {
  endpoint: string;
  token: string;
  timeoutMs: number;
  maxRetryDelayMs: number;
}

interface AtlasSiteOriginEnv {
  ATLAS_SITE_ORIGIN_URL?: string;
  ATLAS_INGRESS_TOKEN?: string;
}

export class AtlasSiteOriginConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AtlasSiteOriginConfigError";
  }
}

export function createAtlasSiteOriginConfig(
  runtime: Pick<EnvironmentContract, "isProduction">,
  env: AtlasSiteOriginEnv,
): AtlasSiteOriginConfig {
  if (!runtime.isProduction) {
    throw new AtlasSiteOriginConfigError(
      "Atlas Site-Origin configuration is Production-only.",
    );
  }

  const baseUrl = env.ATLAS_SITE_ORIGIN_URL?.trim();
  const token = env.ATLAS_INGRESS_TOKEN?.trim();

  if (!baseUrl) {
    throw new AtlasSiteOriginConfigError(
      "ATLAS_SITE_ORIGIN_URL is required in Production.",
    );
  }

  if (!token) {
    throw new AtlasSiteOriginConfigError(
      "ATLAS_INGRESS_TOKEN is required in Production.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new AtlasSiteOriginConfigError(
      "ATLAS_SITE_ORIGIN_URL is invalid.",
    );
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new AtlasSiteOriginConfigError(
      "ATLAS_SITE_ORIGIN_URL must be a credential-free HTTPS base URL.",
    );
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return {
    endpoint: `${normalizedBaseUrl}${ATLAS_SITE_ORIGIN_PATH}`,
    token,
    timeoutMs: 8_000,
    maxRetryDelayMs: 1_000,
  };
}

/** Server route boundary. Never import this helper from a client script. */
export function getAtlasSiteOriginConfig(
  runtime: Pick<EnvironmentContract, "isProduction">,
): AtlasSiteOriginConfig {
  return createAtlasSiteOriginConfig(runtime, {
    ATLAS_SITE_ORIGIN_URL:
      import.meta.env.ATLAS_SITE_ORIGIN_URL,
    ATLAS_INGRESS_TOKEN:
      import.meta.env.ATLAS_INGRESS_TOKEN,
  });
}

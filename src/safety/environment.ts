export type RuntimeEnvironment =
  | "development"
  | "preview"
  | "production"
  | "test";

export type LeadProvider = "mock" | "production";

export const FORBIDDEN_NON_PRODUCTION_CREDENTIALS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SECRET_KEYS",
  "ATLAS_INGRESS_TOKEN",
] as const;

export type ForbiddenCredentialName =
  (typeof FORBIDDEN_NON_PRODUCTION_CREDENTIALS)[number];

export interface EnvironmentInput {
  vercelEnv?: string;
  mode?: string;
  credentials?: Partial<Record<ForbiddenCredentialName, string | undefined>>;
}

export interface EnvironmentContract {
  runtime: RuntimeEnvironment;
  isProduction: boolean;
  allowProductionAnalytics: boolean;
  leadProvider: LeadProvider;
}

export class EnvironmentSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentSafetyError";
  }
}

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim();
  return result ? result : undefined;
}

export function classifyRuntimeEnvironment(
  input: Pick<EnvironmentInput, "vercelEnv" | "mode">,
): RuntimeEnvironment {
  const vercelEnv = normalized(input.vercelEnv);

  if (vercelEnv) {
    if (
      vercelEnv === "development" ||
      vercelEnv === "preview" ||
      vercelEnv === "production"
    ) {
      return vercelEnv;
    }

    throw new EnvironmentSafetyError(
      "Unknown runtime environment in VERCEL_ENV.",
    );
  }

  const mode = normalized(input.mode);

  if (mode === "development") {
    return "development";
  }

  if (mode === "test") {
    return "test";
  }

  if (mode === "production") {
    return "preview";
  }

  if (!mode) {
    return "development";
  }

  throw new EnvironmentSafetyError(
    "Runtime environment could not be classified safely.",
  );
}

function credentialIsPresent(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function assertNoForbiddenNonProductionCredentials(
  runtime: RuntimeEnvironment,
  credentials: EnvironmentInput["credentials"] = {},
): void {
  if (runtime === "production") {
    return;
  }

  for (const name of FORBIDDEN_NON_PRODUCTION_CREDENTIALS) {
    if (credentialIsPresent(credentials[name])) {
      throw new EnvironmentSafetyError(
        `Forbidden credential present in non-production environment: ${name}`,
      );
    }
  }
}

export function createEnvironmentContract(
  input: EnvironmentInput,
): EnvironmentContract {
  const runtime = classifyRuntimeEnvironment(input);

  assertNoForbiddenNonProductionCredentials(
    runtime,
    input.credentials,
  );

  const isProduction = runtime === "production";

  return {
    runtime,
    isProduction,
    allowProductionAnalytics: isProduction,
    leadProvider: isProduction ? "production" : "mock",
  };
}

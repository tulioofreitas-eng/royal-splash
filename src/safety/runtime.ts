import {
  createEnvironmentContract,
  type EnvironmentContract,
} from "./environment.ts";

export interface RuntimeEnvValues {
  VERCEL_ENV?: string;
  MODE?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SECRET_KEYS?: string;
  ATLAS_INGRESS_TOKEN?: string;
}

export function createEnvironmentContractFromRuntimeEnv(
  env: RuntimeEnvValues,
): EnvironmentContract {
  return createEnvironmentContract({
    vercelEnv: env.VERCEL_ENV,
    mode: env.MODE,
    credentials: {
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
      SUPABASE_SECRET_KEYS: env.SUPABASE_SECRET_KEYS,
      ATLAS_INGRESS_TOKEN: env.ATLAS_INGRESS_TOKEN,
    },
  });
}

export function getCurrentEnvironmentContract(): EnvironmentContract {
  return createEnvironmentContractFromRuntimeEnv({
    VERCEL_ENV: import.meta.env.VERCEL_ENV,
    MODE: import.meta.env.MODE,
    SUPABASE_SERVICE_ROLE_KEY:
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY:
      import.meta.env.SUPABASE_SECRET_KEY,
    SUPABASE_SECRET_KEYS:
      import.meta.env.SUPABASE_SECRET_KEYS,
    ATLAS_INGRESS_TOKEN:
      import.meta.env.ATLAS_INGRESS_TOKEN,
  });
}

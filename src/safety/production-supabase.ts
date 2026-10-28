export async function createProductionSupabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");

  return createClient(
    import.meta.env.SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Royal Splash WhatsApp telemetry uses its own named backend secret.
 * Do not silently fall back to the legacy service-role key: an invalid or
 * missing new configuration must be diagnosed before production rollout.
 *
 * This credential is elevated for the full Atlas Supabase project, not
 * limited to cliques_whatsapp. Never import this factory from client code.
 */
const ROYAL_SPLASH_ATLAS_ORIGIN =
  "https://ndabjzvtuelpuooyngdw.supabase.co";

export class RoyalWhatsAppSupabaseConfigError extends Error {
  constructor() {
    super("Royal WhatsApp Supabase production configuration invalid.");
    this.name = "RoyalWhatsAppSupabaseConfigError";
  }
}

export function validateRoyalWhatsAppSupabaseConfig(input: {
  url?: unknown;
  secretKey?: unknown;
}): { url: string; secretKey: string } {
  if (typeof input.url !== "string" || typeof input.secretKey !== "string") {
    throw new RoyalWhatsAppSupabaseConfigError();
  }

  // Require the exact Atlas project. The secret alone cannot tell us which
  // project a new opaque sb_secret_ key belongs to.
  let parsed: URL;
  try {
    parsed = new URL(input.url);
  } catch {
    throw new RoyalWhatsAppSupabaseConfigError();
  }
  if (
    input.url !== ROYAL_SPLASH_ATLAS_ORIGIN &&
    input.url !== ROYAL_SPLASH_ATLAS_ORIGIN + "/"
  ) {
    throw new RoyalWhatsAppSupabaseConfigError();
  }
  if (parsed.origin !== ROYAL_SPLASH_ATLAS_ORIGIN) {
    throw new RoyalWhatsAppSupabaseConfigError();
  }

  // Secrets are opaque, not JWTs. Reject missing, malformed or padded values;
  // never log a key or infer a role from an unverified JWT payload.
  const key = input.secretKey;
  if (
    !/^sb_secret_[A-Za-z0-9_-]{8,}$/.test(key) ||
    key !== key.trim()
  ) {
    throw new RoyalWhatsAppSupabaseConfigError();
  }
  return { url: parsed.origin, secretKey: key };
}

export async function createRoyalWhatsAppClickSupabaseClient() {
  const config = validateRoyalWhatsAppSupabaseConfig({
    url: import.meta.env.SUPABASE_URL,
    secretKey: import.meta.env.SUPABASE_SECRET_KEY,
  });
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

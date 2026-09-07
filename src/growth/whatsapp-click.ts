import { royalPublicPath } from "../seo/royal-policy.ts";

/**
 * Current persistence contract is page-only. Never overload pagina with tokens,
 * campaign context, URLs or form fields while the correlation DB gate is open.
 * A route allowlist also prevents arbitrary visitor strings being stored here.
 */
export function normalizeWhatsAppClickPage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return royalPublicPath(value) ?? null;
}

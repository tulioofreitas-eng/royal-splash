import { royalPublicPath } from "../seo/royal-policy.ts";

/**
 * WhatsApp diagnostic routes are independent of the SEO robots allowlist.
 * Active RJ landing pages are noindex but still need page-only diagnostics.
 * Never overload pagina with contact data, tokens, campaigns or full URLs.
 */
const ACTIVE_RJ_LANDING_PAGES = new Set([
  "/lp/reforma-rj",
  "/lp/piscinas-rj",
  "/lp/fibra-rj",
  "/lp/vazamento-rj",
]);

export function normalizeWhatsAppClickPage(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const page = value === "/" ? "/" : value.replace(/\/$/, "");

  // Separate analytics allowlist: do not make campaign LPs indexable just
  // to keep the diagnostic event's page reference intact.
  if (ACTIVE_RJ_LANDING_PAGES.has(page)) return page;
  return royalPublicPath(page) ?? null;
}

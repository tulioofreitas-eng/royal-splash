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

/**
 * A shared, page-local cooldown for the two independent handoff observers.
 * Memory-only: no cookies, IP, intake identifier or persistent storage.
 * This reduces duplicate frontend requests, but is NOT database idempotency
 * and does not protect the public route against scripted traffic.
 */
export const WHATSAPP_CLICK_COOLDOWN_MS = 15_000;
interface WhatsAppClickWindow extends Window {
  __royalWhatsAppDiagnosticLastAt?: Record<string, number>;
}

export function claimWhatsAppDiagnosticClick(
  browserWindow: Window,
  page: string,
  now: number = Date.now(),
): boolean {
  const normalized = normalizeWhatsAppClickPage(page);
  if (!normalized) return false;
  const runtime = browserWindow as WhatsAppClickWindow;
  const recent = runtime.__royalWhatsAppDiagnosticLastAt ??=
    Object.create(null) as Record<string, number>;
  const last = recent[normalized];
  if (typeof last === "number" && now - last >= 0 &&
    now - last < WHATSAPP_CLICK_COOLDOWN_MS) return false;
  recent[normalized] = now;
  return true;
}

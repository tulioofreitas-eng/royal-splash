import { describe, expect, it } from "vitest";
import {
  claimWhatsAppDiagnosticClick,
  WHATSAPP_CLICK_COOLDOWN_MS,
} from "../../src/growth/whatsapp-click.ts";

describe("memory-only WhatsApp click diagnostics", () => {
  it("suppresses duplicate observers and double clicks on the same page", () => {
    const browserWindow = {} as Window;
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/lp/fibra-rj", 1000))
      .toBe(true);
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/lp/fibra-rj", 1001))
      .toBe(false);
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/lp/fibra-rj",
      1000 + WHATSAPP_CLICK_COOLDOWN_MS - 1)).toBe(false);
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/lp/fibra-rj",
      1000 + WHATSAPP_CLICK_COOLDOWN_MS)).toBe(true);
  });

  it("does not block independent page diagnostics", () => {
    const browserWindow = {} as Window;
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/lp/fibra-rj", 2000))
      .toBe(true);
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/lp/vazamento-rj", 2001))
      .toBe(true);
    expect(claimWhatsAppDiagnosticClick(browserWindow, "/unapproved", 2002))
      .toBe(false);
  });

  it("keeps dedup state in memory and without contact identifiers", () => {
    const browserWindow = {} as Window;
    claimWhatsAppDiagnosticClick(browserWindow, "/lp/piscinas-rj", 3000);
    const runtime = browserWindow as unknown as Record<string, unknown>;
    const key = "__royalWhatsAppDiagnosticLastAt";
    expect(runtime[key]).toEqual({ "/lp/piscinas-rj": 3000 });
    expect(Object.keys(runtime)).toEqual([key]);
  });
});

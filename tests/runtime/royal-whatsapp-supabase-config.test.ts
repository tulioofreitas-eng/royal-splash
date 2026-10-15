import { describe, expect, it } from "vitest";
import {
  RoyalWhatsAppSupabaseConfigError,
  validateRoyalWhatsAppSupabaseConfig,
} from "../../src/safety/production-supabase.ts";

const URL = "https://ndabjzvtuelpuooyngdw.supabase.co";
// Dummy values below are intentionally fake and never used for API calls.
const SECRET = "sb_secret_SYNTHETIC_TEST_ONLY_1234";

describe("Royal Splash dedicated WhatsApp Supabase configuration", () => {
  it("accepts only the expected Atlas project and opaque backend secret", () => {
    expect(validateRoyalWhatsAppSupabaseConfig({
      url: URL,
      secretKey: SECRET,
    })).toEqual({ url: URL, secretKey: SECRET });
    expect(validateRoyalWhatsAppSupabaseConfig({
      url: URL + "/",
      secretKey: SECRET,
    })).toEqual({ url: URL, secretKey: SECRET });
  });

  for (const invalidUrl of [
    "https://unrelatedproject.supabase.co",
    "https://ndabjzvtuelpuooyngdw.supabase.co.evil.example",
    URL + "/rest/v1",
    URL + "?token=sensitive",
    " " + URL,
    "http://ndabjzvtuelpuooyngdw.supabase.co",
    undefined,
  ]) {
    it("rejects incorrect or unexpected Supabase URL", () => {
      expect(() => validateRoyalWhatsAppSupabaseConfig({
        url: invalidUrl,
        secretKey: SECRET,
      })).toThrow(RoyalWhatsAppSupabaseConfigError);
    });
  }

  for (const invalidSecret of [
    undefined,
    "",
    "eyJnot-a-secret",
    "sb_publishable_fake_00000000",
    "sb_secret_",
    " " + SECRET,
    SECRET + "\n",
    '"' + SECRET + '"',
  ]) {
    it("rejects absent, padded or incorrectly typed secrets", () => {
      expect(() => validateRoyalWhatsAppSupabaseConfig({
        url: URL,
        secretKey: invalidSecret,
      })).toThrow(RoyalWhatsAppSupabaseConfigError);
    });
  }

  it("never echoes the credential or URL contents in configuration errors", () => {
    const sensitiveTestMarker = "SYNTHETIC_NOT_A_REAL_SECRET";
    try {
      validateRoyalWhatsAppSupabaseConfig({
        url: URL,
        secretKey: "sb_secret_" + sensitiveTestMarker + "!",
      });
      throw Error("Expected a configuration error");
    } catch (error) {
      expect(error).toBeInstanceOf(RoyalWhatsAppSupabaseConfigError);
      expect(String(error)).not.toContain(sensitiveTestMarker);
      expect(JSON.stringify(error)).not.toContain(sensitiveTestMarker);
    }
  });
});

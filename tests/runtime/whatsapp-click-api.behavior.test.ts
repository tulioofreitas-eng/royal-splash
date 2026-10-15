import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  provider: "production" as "production" | "mock",
  insertError: null as null | { code: string; message: string },
  clientThrows: false,
  insertThrows: false,
  inserted: [] as Array<{ table: string; value: unknown }>,
}));

vi.mock("../../src/safety/runtime.ts", () => ({
  getCurrentEnvironmentContract: () => ({ leadProvider: state.provider }),
}));

vi.mock("../../src/safety/production-supabase.ts", () => ({
  createRoyalWhatsAppClickSupabaseClient: async () => {
    if (state.clientThrows) throw new Error("sensitive provider exception");
    return {
      from: (table: string) => ({
        insert: async (value: unknown) => {
          if (state.insertThrows) throw new Error("sensitive insert exception");
          state.inserted.push({ table, value });
          return { error: state.insertError };
        },
      }),
    };
  },
}));

import { POST } from "../../src/pages/api/whatsapp-click.ts";

const endpoint = async (body: unknown, options: {
  origin?: string | null;
  site?: string | null;
  contentType?: string;
  url?: string;
  rawBody?: string;
} = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": options.contentType ?? "application/json",
    ...(options.origin === null ? {} : {
      Origin: options.origin ?? "https://www.royalsplash.com.br",
    }),
    ...(options.site === null ? {} : {
      "Sec-Fetch-Site": options.site ?? "same-origin",
    }),
  };
  const request = new Request(
    options.url ?? "https://www.royalsplash.com.br/api/whatsapp-click",
    { method: "POST", headers, body: options.rawBody ?? JSON.stringify(body) },
  );
  return POST({ request } as Parameters<typeof POST>[0]);
};

describe("P0 WhatsApp click endpoint behavior with isolated provider doubles", () => {
  beforeEach(() => {
    state.provider = "production";
    state.insertError = null;
    state.clientThrows = false;
    state.insertThrows = false;
    state.inserted.length = 0;
    vi.restoreAllMocks();
  });

  it("records only the allowlisted page and reports real success", async () => {
    const response = await endpoint({ pagina: "/lp/fibra-rj" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(state.inserted).toEqual([{
      table: "cliques_whatsapp",
      value: {
        empresa_id: "1f7b165c-0918-4090-a5a7-107560a05c55",
        pagina: "/lp/fibra-rj",
      },
    }]);
  });

  it("fails visibly but safely when the database rejects the insert", async () => {
    state.insertError = {
      code: "23503",
      message: "PRIVATE MESSAGE WITH DETAILS — MUST NOT LOG",
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await endpoint({ pagina: "/lp/vazamento-rj" });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "persistence_failed",
    });
    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).toContain("23503");
    expect(logged).not.toContain("PRIVATE MESSAGE");
  });

  it("hides unexpected exception details while reporting a 503", async () => {
    state.clientThrows = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await endpoint({ pagina: "/lp/fibra-rj" });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "temporarily_unavailable",
    });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("sensitive provider");
  });

  it("does not write real data for Preview mock", async () => {
    state.provider = "mock";
    const response = await endpoint({ pagina: "/lp/fibra-rj" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, mock: true });
    expect(state.inserted).toEqual([]);
  });

  it("preserves all four active RJ landing page references without changing SEO allowlists", async () => {
    for (const page of [
      "/lp/fibra-rj",
      "/lp/vazamento-rj",
      "/lp/piscinas-rj",
      "/lp/reforma-rj",
    ]) {
      state.inserted.length = 0;
      const response = await endpoint({ pagina: page });
      expect(response.status).toBe(200);
      expect(state.inserted[0]).toMatchObject({
        table: "cliques_whatsapp",
        value: { pagina: page },
      });
    }
  });

  it("rejects unrecognized pages before creating a database row", async () => {
    const response = await endpoint({ pagina: "/path-that-is-not-allowed" });
    expect(response.status).toBe(400);
    expect(state.inserted).toEqual([]);
  });
});

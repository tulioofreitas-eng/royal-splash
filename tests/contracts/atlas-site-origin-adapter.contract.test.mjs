import assert from "node:assert/strict";
import test from "node:test";

import {
  ATLAS_PUBLIC_ERROR_CODES,
  AtlasSiteOriginAdapter,
  AtlasSiteOriginError,
  mapAtlasPublicError,
} from "../../src/integrations/leads/atlas-site-origin.ts";

const NOW = Date.parse("2026-09-02T15:00:00.000Z");
const CONFIG = {
  endpoint: "https://atlas.invalid/api/intake/site-origin",
  token: "atlas-secret-token",
  timeoutMs: 8_000,
  maxRetryDelayMs: 1_000,
};

function createLead() {
  return {
    schemaVersion: "site-lead.v1",
    submissionRef: "site.12345678-1234-4123-8123-123456789abc",
    contact: {
      name: "Pessoa Sensível",
      email: "private@example.com",
      phone: "+55 21 99999-0000",
    },
    city: "Rio de Janeiro",
    interest: { description: "Projeto confidencial" },
    acquisition: {
      ingressChannel: "site_form",
      pageRef: "/inicie-seu-projeto",
    },
    consent: {
      state: "granted",
      policyRef: "/politica-de-privacidade",
      capturedAt: "2026-09-02T14:59:30.000Z",
    },
  };
}

function dependencies(fetchImpl, options = {}) {
  return {
    fetch: fetchImpl,
    sleep: options.sleep ?? (async () => {}),
    now: options.now ?? (() => NOW),
    createTimeoutSignal:
      options.createTimeoutSignal ?? (() => new AbortController().signal),
    log: options.log ?? (() => {}),
  };
}

test("POSTs JSON with byte-identical idempotency key and submission ref", async () => {
  const calls = [];
  const adapter = new AtlasSiteOriginAdapter(
    CONFIG,
    dependencies(async (url, init) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({ caseId: "case-123", replay: false }),
        { status: 201 },
      );
    }),
  );

  await adapter.submit(createLead());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, CONFIG.endpoint);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.equal(calls[0].init.headers.authorization, `Bearer ${CONFIG.token}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(
    calls[0].init.headers["idempotency-key"],
    body.submission.ref,
  );
});

test("200 replay is ordinary success", async () => {
  const logs = [];
  const adapter = new AtlasSiteOriginAdapter(
    CONFIG,
    dependencies(
      async () =>
        new Response(
          JSON.stringify({ caseId: "case-replay", replay: true }),
          { status: 200 },
        ),
      { log: (record) => logs.push(record) },
    ),
  );

  await adapter.submit(createLead());
  assert.equal(logs[0].resultCode, "REPLAY");
  assert.equal(logs[0].replay, true);
});

for (const [status, code] of [
  [400, "INVALID_REQUEST"],
  [401, "UNAUTHORIZED_CALLER"],
  [422, "INVALID_CONSENT"],
]) {
  test(`${status} is never retried`, async () => {
    let calls = 0;
    const adapter = new AtlasSiteOriginAdapter(
      CONFIG,
      dependencies(async () => {
        calls += 1;
        return new Response(JSON.stringify({ code }), { status });
      }),
    );

    await assert.rejects(() => adapter.submit(createLead()), AtlasSiteOriginError);
    assert.equal(calls, 1);
  });
}

test("429 retries once, honors bounded Retry-After, and preserves payload/ref", async () => {
  const calls = [];
  const delays = [];
  const adapter = new AtlasSiteOriginAdapter(
    CONFIG,
    dependencies(
      async (_url, init) => {
        calls.push(init);
        return calls.length === 1
          ? new Response(JSON.stringify({ code: "RATE_LIMITED" }), {
              status: 429,
              headers: { "retry-after": "5" },
            })
          : new Response(JSON.stringify({ replay: true }), { status: 200 });
      },
      { sleep: async (delay) => delays.push(delay) },
    ),
  );

  await adapter.submit(createLead());

  assert.deepEqual(delays, [1_000]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(
    calls[0].headers["idempotency-key"],
    calls[1].headers["idempotency-key"],
  );
});

for (const status of [500, 503]) {
  test(`${status} makes at most one retry`, async () => {
    let calls = 0;
    const adapter = new AtlasSiteOriginAdapter(
      CONFIG,
      dependencies(async () => {
        calls += 1;
        return new Response("{}", { status });
      }),
    );

    await assert.rejects(() => adapter.submit(createLead()), AtlasSiteOriginError);
    assert.equal(calls, 2);
  });
}

for (const failure of ["network", "timeout"]) {
  test(`${failure} failure makes at most one retry`, async () => {
    let calls = 0;
    const adapter = new AtlasSiteOriginAdapter(
      CONFIG,
      dependencies(async () => {
        calls += 1;
        throw failure === "timeout"
          ? new DOMException("aborted", "AbortError")
          : new TypeError("network down");
      }),
    );

    await assert.rejects(() => adapter.submit(createLead()), AtlasSiteOriginError);
    assert.equal(calls, 2);
  });
}

test("public Atlas error mapping is exhaustive and visitor-safe", () => {
  assert.equal(ATLAS_PUBLIC_ERROR_CODES.length, 8);

  for (const code of ATLAS_PUBLIC_ERROR_CODES) {
    const error = mapAtlasPublicError(code);
    assert.equal(error instanceof AtlasSiteOriginError, true);
    assert.equal(error.message, "Site lead delivery failed.");
    assert.equal(error.message.includes(code), false);
  }
});

test("logs only allowlisted non-PII fields and never leaks credentials", async () => {
  const logs = [];
  const adapter = new AtlasSiteOriginAdapter(
    CONFIG,
    dependencies(
      async () =>
        new Response(
          JSON.stringify({
            code: "UNAUTHORIZED_CALLER",
            token: CONFIG.token,
            email: "private@example.com",
          }),
          { status: 401 },
        ),
      { log: (record) => logs.push(record) },
    ),
  );

  const error = await adapter.submit(createLead()).catch((caught) => caught);
  const allowedKeys = [
    "submissionRef",
    "channel",
    "pageRef",
    "resultCode",
    "caseId",
    "replay",
    "duration",
  ];

  assert.deepEqual(Object.keys(logs[0]).sort(), [
    "channel",
    "duration",
    "pageRef",
    "resultCode",
    "submissionRef",
  ]);
  assert.equal(Object.keys(logs[0]).every((key) => allowedKeys.includes(key)), true);
  assert.equal(JSON.stringify(logs).includes("private@example.com"), false);
  assert.equal(JSON.stringify(logs).includes(CONFIG.token), false);
  assert.equal(JSON.stringify(error).includes(CONFIG.token), false);
  assert.equal(error.message.includes(CONFIG.token), false);
});

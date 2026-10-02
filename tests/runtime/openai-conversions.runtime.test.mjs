import assert from "node:assert/strict";
import test from "node:test";

import {
  sendOpenAILeadCreated,
} from "../../src/integrations/ads/openai-conversions.ts";

test("skips server conversion without marketing consent", async () => {
  let called = false;

  const result = await sendOpenAILeadCreated({
    apiKey: "secret",
    submissionRef: "RS-test-1",
    pageRef: "/lp/piscinas-rj",
    marketingConsent: false,
    fetchImpl: async () => {
      called = true;
      return new Response(null, { status: 200 });
    },
  });

  assert.deepEqual(result, {
    status: "skipped",
    reason: "no_marketing_consent",
  });
  assert.equal(called, false);
});

test("sends lead_created with shared event id and OpenAI attribution cookies", async () => {
  let capturedUrl = "";
  let capturedInit;

  const result = await sendOpenAILeadCreated({
    apiKey: "conversion-secret",
    submissionRef: "RS-piscinas-rj-event-123",
    pageRef: "/lp/piscinas-rj",
    marketingConsent: true,
    cookieHeader: "__oppref=oppref_abc; __obref=123e4567-e89b-42d3-a456-426614174000",
    nowMs: 1790955000000,
    fetchImpl: async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(null, { status: 200 });
    },
  });

  assert.deepEqual(result, { status: "sent" });
  assert.equal(
    capturedUrl,
    "https://bzr.openai.com/v1/events?pid=G7za354ukz8KMXzFt6Vayr",
  );

  assert.equal(
    capturedInit.headers.Authorization,
    "Bearer conversion-secret",
  );

  const payload = JSON.parse(capturedInit.body);
  assert.equal(payload.validate_only, false);
  assert.deepEqual(payload.events, [
    {
      id: "RS-piscinas-rj-event-123",
      type: "lead_created",
      timestamp_ms: 1790955000000,
      source_url: "https://www.royalsplash.com.br/lp/piscinas-rj",
      action_source: "web",
      data: {
        type: "customer_action",
      },
      oppref: "oppref_abc",
      user: {
        obref: "123e4567-e89b-42d3-a456-426614174000",
      },
    },
  ]);
});

test("server conversion failure never throws into the Intake flow", async () => {
  const result = await sendOpenAILeadCreated({
    apiKey: "secret",
    submissionRef: "RS-test-failure",
    pageRef: "/lp/reforma-rj",
    marketingConsent: true,
    fetchImpl: async () =>
      new Response(null, { status: 503 }),
  });

  assert.deepEqual(result, {
    status: "failed",
    httpStatus: 503,
  });
});

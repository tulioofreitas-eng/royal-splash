import assert from "node:assert/strict";
import test from "node:test";

import {
  GROWTH_FIRST_TOUCH_RETENTION_MS,
  GROWTH_FIRST_TOUCH_STORAGE_KEY,
  InvalidGrowthAttributionError,
  composeGrowthAttribution,
  createBrowserGrowthAttributionRuntime,
  normalizeGrowthAttribution,
  observeFirstTouch,
  observeSubmissionTouch,
  persistFirstTouchAfterConsent,
  readPersistedFirstTouch,
} from "../../src/growth/attribution.ts";
import {
  GROWTH_MEDIUM_ALLOW,
  GROWTH_SOURCE_ALLOW,
} from "../../src/domains/leads/contracts.ts";

const NOW = new Date("2026-09-04T12:00:00.000Z");

class MemoryStorage {
  values = new Map();
  getCalls = 0;
  setCalls = 0;

  getItem(key) {
    this.getCalls += 1;
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.setCalls += 1;
    this.values.set(key, value);
  }
}

function candidate(overrides = {}) {
  return {
    campaignRef: "campaign.01",
    medium: "paid_search",
    source: "google",
    landingPageRef: "/lp/piscinas",
    referrerHost: "www.google.com",
    capturedAt: NOW.toISOString(),
    ...overrides,
  };
}

test("new First Touch remains ephemeral before consent", () => {
  const storage = new MemoryStorage();
  const runtime = createBrowserGrowthAttributionRuntime(storage);
  const observed = runtime.observe({
    url: new URL(
      "https://royalsplash.com.br/lp/piscinas?utm_campaign=campaign.01&utm_medium=paid_search&utm_source=google",
    ),
    referrer: "https://www.google.com/search?q=piscina",
    now: NOW,
  });

  assert.deepEqual(runtime.getObservedFirstTouch(), observed);
  assert.equal(storage.setCalls, 0);
  assert.equal(storage.values.has(GROWTH_FIRST_TOUCH_STORAGE_KEY), false);
});

test("explicit consent commits the observed First Touch", () => {
  const storage = new MemoryStorage();
  const runtime = createBrowserGrowthAttributionRuntime(storage);
  runtime.observe({
    url: new URL("https://royalsplash.com.br/lp/piscinas"),
    now: NOW,
  });

  const persisted = runtime.persistAfterConsent(NOW);

  assert.equal(storage.setCalls, 1);
  assert.deepEqual(persisted, {
    capturedAt: NOW.toISOString(),
    landingPageRef: "/lp/piscinas",
  });
});

test("a valid persisted First Touch is retained without a write", () => {
  const storage = new MemoryStorage();
  storage.values.set(
    GROWTH_FIRST_TOUCH_STORAGE_KEY,
    JSON.stringify({ version: 1, firstTouch: candidate() }),
  );

  const result = persistFirstTouchAfterConsent(
    storage,
    candidate({ campaignRef: "later" }),
    NOW,
  );

  assert.equal(storage.setCalls, 0);
  assert.equal(result.campaignRef, "campaign.01");
});

test("30-day retention is inclusive and expires immediately after the window", () => {
  const storage = new MemoryStorage();
  const capturedAt = new Date(
    NOW.getTime() - GROWTH_FIRST_TOUCH_RETENTION_MS,
  ).toISOString();
  storage.values.set(
    GROWTH_FIRST_TOUCH_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      firstTouch: candidate({ capturedAt }),
    }),
  );

  assert.ok(readPersistedFirstTouch(storage, NOW));
  assert.equal(
    readPersistedFirstTouch(
      storage,
      new Date(NOW.getTime() + 1),
    ),
    undefined,
  );
});

for (const [label, stored] of [
  ["malformed", "not-json"],
  [
    "future",
    JSON.stringify({
      version: 1,
      firstTouch: candidate({
        capturedAt: new Date(NOW.getTime() + 1).toISOString(),
      }),
    }),
  ],
  [
    "expired",
    JSON.stringify({
      version: 1,
      firstTouch: candidate({
        capturedAt: new Date(
          NOW.getTime() - GROWTH_FIRST_TOUCH_RETENTION_MS - 1,
        ).toISOString(),
      }),
    }),
  ],
  [
    "wrong version",
    JSON.stringify({ version: 2, firstTouch: candidate() }),
  ],
]) {
  test(`${label} storage fails closed and can be replaced after consent`, () => {
    const storage = new MemoryStorage();
    storage.values.set(GROWTH_FIRST_TOUCH_STORAGE_KEY, stored);

    assert.equal(readPersistedFirstTouch(storage, NOW), undefined);
    const result = persistFirstTouchAfterConsent(
      storage,
      candidate({ campaignRef: "replacement" }),
      NOW,
    );

    assert.equal(storage.setCalls, 1);
    assert.equal(result.campaignRef, "replacement");
  });
}

test("storage failures never block attribution-free conversion", () => {
  const storage = {
    getItem() {
      throw new Error("unavailable");
    },
    setItem() {
      throw new Error("unavailable");
    },
  };

  assert.equal(readPersistedFirstTouch(storage, NOW), undefined);
  assert.equal(
    persistFirstTouchAfterConsent(storage, candidate(), NOW),
    undefined,
  );
});

test("all and only Atlas 0163 medium/source values are observed", () => {
  for (const medium of GROWTH_MEDIUM_ALLOW) {
    const touch = observeSubmissionTouch(
      new URL(`https://royalsplash.com.br/?utm_medium=${medium}`),
    );
    assert.equal(touch.medium, medium);
  }

  for (const source of GROWTH_SOURCE_ALLOW) {
    const touch = observeSubmissionTouch(
      new URL(`https://royalsplash.com.br/?utm_source=${source}`),
    );
    assert.equal(touch.source, source);
  }

  for (const alias of ["cpc", "fb", "email", "twitter", "email_marketing"]) {
    const touch = observeSubmissionTouch(
      new URL(
        `https://royalsplash.com.br/inicie-seu-projeto?utm_medium=${alias}&utm_source=${alias}`,
      ),
    );
    assert.equal(touch.medium, undefined);
    assert.equal(touch.source, undefined);
  }
});

test("First Touch retains pathname and external host only", () => {
  const observed = observeFirstTouch({
    url: new URL(
      "https://royalsplash.com.br/lp/fibra?utm_campaign=safe#detalhe",
    ),
    referrer: "https://search.example.com/results?q=sensitive",
    now: NOW,
  });

  assert.equal(observed.landingPageRef, "/lp/fibra");
  assert.equal(observed.referrerHost, "search.example.com");
  assert.equal(JSON.stringify(observed).includes("results"), false);
  assert.equal(JSON.stringify(observed).includes("sensitive"), false);
});

test("same-site and raw invalid referrers are omitted", () => {
  const url = new URL("https://royalsplash.com.br/lp/fibra");

  assert.equal(
    observeFirstTouch({
      url,
      referrer: "https://royalsplash.com.br/projetos?internal=1",
      now: NOW,
    }).referrerHost,
    undefined,
  );
  assert.equal(
    observeFirstTouch({ url, referrer: "not a url", now: NOW })
      .referrerHost,
    undefined,
  );
});

test("Submission Touch uses current UTM keys and ignores Royal CTA parameters", () => {
  const touch = observeSubmissionTouch(
    new URL(
      "https://royalsplash.com.br/inicie-seu-projeto?source=site_header&pageRef=%2Fsobre&utm_campaign=current&utm_medium=paid_social&utm_source=meta",
    ),
  );

  assert.deepEqual(touch, {
    campaignRef: "current",
    medium: "paid_social",
    source: "meta",
    pageRef: "/inicie-seu-projeto",
  });
});

test("Submission Touch is not inferred from First Touch", () => {
  const firstTouch = candidate();
  const submissionTouch = observeSubmissionTouch(
    new URL("https://royalsplash.com.br/inicie-seu-projeto"),
  );
  const attribution = composeGrowthAttribution(
    firstTouch,
    submissionTouch,
  );

  assert.deepEqual(submissionTouch, {
    pageRef: "/inicie-seu-projeto",
  });
  assert.equal(attribution.submissionTouch.campaignRef, undefined);
  assert.equal(attribution.submissionTouch.medium, undefined);
  assert.equal(attribution.submissionTouch.source, undefined);
});

test("strict normalization rejects unknown fields, aliases, raw referrers, and stale First Touch", () => {
  for (const attribution of [
    { submissionTouch: { pageRef: "/", unknown: "x" } },
    { submissionTouch: { pageRef: "/", medium: "cpc" } },
    {
      firstTouch: candidate({
        referrerHost: "https://www.google.com/search",
      }),
    },
    {
      firstTouch: candidate({
        capturedAt: new Date(
          NOW.getTime() - GROWTH_FIRST_TOUCH_RETENTION_MS - 1,
        ).toISOString(),
      }),
    },
  ]) {
    assert.throws(
      () => normalizeGrowthAttribution(attribution, NOW),
      InvalidGrowthAttributionError,
    );
  }
});

test("persisted attribution contains no PII, submission, device, or raw referrer data", () => {
  const storage = new MemoryStorage();
  persistFirstTouchAfterConsent(storage, candidate(), NOW);
  const serialized = storage.values.get(GROWTH_FIRST_TOUCH_STORAGE_KEY);

  for (const forbidden of [
    "name",
    "email",
    "phone",
    "city",
    "project",
    "submissionRef",
    "ip",
    "userAgent",
    "device",
    "session",
    "https://www.google.com/search",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

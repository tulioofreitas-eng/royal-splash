import assert from "node:assert/strict";
import test from "node:test";

import {
  createMeasurementConsentChoice,
  parseStoredMeasurementConsent,
  shouldLoadMeasurementContainer,
  toGoogleConsentState,
} from "../../src/privacy/measurement-consent.ts";

test("measurement consent defaults all optional Google consent types to denied", () => {
  assert.deepEqual(
    toGoogleConsentState(undefined),
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  );
});

test("analytics-only remains independent from marketing consent", () => {
  const choice = createMeasurementConsentChoice({
    analytics: true,
    marketing: false,
  });

  assert.deepEqual(
    toGoogleConsentState(choice),
    {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  );

  assert.equal(
    shouldLoadMeasurementContainer(choice),
    true,
  );
});

test("marketing-only remains independent from analytics consent", () => {
  const choice = createMeasurementConsentChoice({
    analytics: false,
    marketing: true,
  });

  assert.deepEqual(
    toGoogleConsentState(choice),
    {
      analytics_storage: "denied",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    },
  );

  assert.equal(
    shouldLoadMeasurementContainer(choice),
    true,
  );
});

test("deny-all keeps measurement container blocked", () => {
  const choice = createMeasurementConsentChoice({
    analytics: false,
    marketing: false,
  });

  assert.equal(
    shouldLoadMeasurementContainer(choice),
    false,
  );
});

test("stored consent accepts only the current explicit boolean contract", () => {
  assert.deepEqual(
    parseStoredMeasurementConsent(
      JSON.stringify({
        version: 1,
        analytics: true,
        marketing: false,
      }),
    ),
    {
      version: 1,
      analytics: true,
      marketing: false,
    },
  );

  assert.equal(
    parseStoredMeasurementConsent(
      JSON.stringify({
        version: 2,
        analytics: true,
        marketing: true,
      }),
    ),
    undefined,
  );

  assert.equal(
    parseStoredMeasurementConsent(
      JSON.stringify({
        version: 1,
        analytics: "yes",
        marketing: true,
      }),
    ),
    undefined,
  );
});

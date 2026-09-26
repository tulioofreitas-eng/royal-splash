import assert from "node:assert/strict";
import test from "node:test";

import {
  emitIntakeCreatedOnce,
} from "../../src/growth/emitIntakeCreatedOnce.ts";

function installSessionStorage() {
  const values = new Map();

  globalThis.sessionStorage = {
    getItem(key) {
      return values.has(key)
        ? values.get(key)
        : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    get length() {
      return values.size;
    },
  };

  return values;
}

const event = {
  service_intent: "MAJOR_RENOVATION",
  acquisition_geography: "RJ",
  experiment_id: "HV-RJ-MAJOR-RENOVATION",
  entry_surface: "/lp/reforma-rj",
  has_attachments: false,
};

test("canonical browser signal remains observable while GTM delivery is blocked without Marketing consent", () => {
  installSessionStorage();

  const dispatched = [];
  const dataLayer = [];

  globalThis.window = {
    dataLayer,
    __royalMeasurementConsent: {
      get: () => ({
        analytics: true,
        marketing: false,
      }),
    },
    dispatchEvent(browserEvent) {
      dispatched.push(browserEvent);
      return true;
    },
  };

  emitIntakeCreatedOnce(
    "consent-denied-ref",
    event,
  );

  assert.equal(dispatched.length, 1);
  assert.equal(
    dispatched[0].type,
    "royal:intake-created",
  );
  assert.equal(dataLayer.length, 0);
});

test("Marketing consent allows exactly one GTM intake_created delivery", () => {
  installSessionStorage();

  const dispatched = [];
  const dataLayer = [];

  globalThis.window = {
    dataLayer,
    __royalMeasurementConsent: {
      get: () => ({
        analytics: false,
        marketing: true,
      }),
    },
    dispatchEvent(browserEvent) {
      dispatched.push(browserEvent);
      return true;
    },
  };

  emitIntakeCreatedOnce(
    "marketing-granted-ref",
    event,
  );

  emitIntakeCreatedOnce(
    "marketing-granted-ref",
    event,
  );

  assert.equal(dispatched.length, 1);
  assert.deepEqual(
    dataLayer,
    [
      {
        event: "intake_created",
        ...event,
      },
    ],
  );

  const serialized = JSON.stringify(
    dataLayer[0],
  ).toLowerCase();

  for (const piiKey of [
    "name",
    "nome",
    "phone",
    "telefone",
    "email",
    "projectneed",
  ]) {
    assert.equal(
      serialized.includes(piiKey),
      false,
    );
  }
});

test("preview/test fallback preserves deterministic GTM contract when production consent runtime is absent", () => {
  installSessionStorage();

  const dataLayer = [];

  globalThis.window = {
    dataLayer,
    dispatchEvent() {
      return true;
    },
  };

  emitIntakeCreatedOnce(
    "preview-contract-ref",
    event,
  );

  assert.equal(
    dataLayer.filter(
      (value) =>
        value?.event === "intake_created",
    ).length,
    1,
  );
});

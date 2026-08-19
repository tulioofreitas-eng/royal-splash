import assert from "node:assert/strict";
import test from "node:test";

import {
  EnvironmentSafetyError,
  createEnvironmentContract,
} from "../../src/safety/environment.ts";

test("classifies Vercel production deterministically", () => {
  const contract = createEnvironmentContract({
    vercelEnv: "production",
    mode: "production",
  });

  assert.equal(contract.runtime, "production");
  assert.equal(contract.isProduction, true);
  assert.equal(contract.allowProductionAnalytics, true);
  assert.equal(contract.leadProvider, "production");
});

test("classifies Vercel preview as non-production", () => {
  const contract = createEnvironmentContract({
    vercelEnv: "preview",
    mode: "production",
  });

  assert.equal(contract.runtime, "preview");
  assert.equal(contract.isProduction, false);
  assert.equal(contract.allowProductionAnalytics, false);
  assert.equal(contract.leadProvider, "mock");
});

test("classifies Vercel development as non-production", () => {
  const contract = createEnvironmentContract({
    vercelEnv: "development",
    mode: "development",
  });

  assert.equal(contract.runtime, "development");
  assert.equal(contract.leadProvider, "mock");
});

test("classifies local development when VERCEL_ENV is absent", () => {
  const contract = createEnvironmentContract({
    mode: "development",
  });

  assert.equal(contract.runtime, "development");
  assert.equal(contract.allowProductionAnalytics, false);
  assert.equal(contract.leadProvider, "mock");
});

test("classifies explicit test mode when VERCEL_ENV is absent", () => {
  const contract = createEnvironmentContract({
    mode: "test",
  });

  assert.equal(contract.runtime, "test");
  assert.equal(contract.allowProductionAnalytics, false);
  assert.equal(contract.leadProvider, "mock");
});

test("fails closed for local production mode without VERCEL_ENV", () => {
  assert.throws(
    () =>
      createEnvironmentContract({
        mode: "production",
      }),
    EnvironmentSafetyError,
  );
});

test("fails closed for an unknown VERCEL_ENV value", () => {
  assert.throws(
    () =>
      createEnvironmentContract({
        vercelEnv: "unexpected",
        mode: "production",
      }),
    EnvironmentSafetyError,
  );
});

test("rejects service-role credential in preview without exposing its value", () => {
  const secretValue = "must-never-appear-in-error-output";

  assert.throws(
    () =>
      createEnvironmentContract({
        vercelEnv: "preview",
        mode: "production",
        credentials: {
          SUPABASE_SERVICE_ROLE_KEY: secretValue,
        },
      }),
    (error) => {
      assert.equal(error instanceof EnvironmentSafetyError, true);
      assert.match(error.message, /SUPABASE_SERVICE_ROLE_KEY/);
      assert.equal(error.message.includes(secretValue), false);
      return true;
    },
  );
});

test("rejects Supabase secret credential in development", () => {
  assert.throws(
    () =>
      createEnvironmentContract({
        mode: "development",
        credentials: {
          SUPABASE_SECRET_KEY: "present",
        },
      }),
    /SUPABASE_SECRET_KEY/,
  );
});

test("rejects Atlas production ingress credential in preview", () => {
  assert.throws(
    () =>
      createEnvironmentContract({
        vercelEnv: "preview",
        mode: "production",
        credentials: {
          ATLAS_INGRESS_TOKEN: "present",
        },
      }),
    /ATLAS_INGRESS_TOKEN/,
  );
});

test("production classification does not reject production-only credentials", () => {
  const contract = createEnvironmentContract({
    vercelEnv: "production",
    mode: "production",
    credentials: {
      SUPABASE_SERVICE_ROLE_KEY: "present",
    },
  });

  assert.equal(contract.runtime, "production");
  assert.equal(contract.leadProvider, "production");
});

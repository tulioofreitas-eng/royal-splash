import assert from "node:assert/strict";
import test from "node:test";

import {
  createEnvironmentContractFromRuntimeEnv,
} from "../../src/safety/runtime.ts";

test("maps Vercel Preview runtime to mock-only non-production", () => {
  const contract = createEnvironmentContractFromRuntimeEnv({
    VERCEL_ENV: "preview",
    MODE: "production",
  });

  assert.equal(contract.runtime, "preview");
  assert.equal(contract.isProduction, false);
  assert.equal(contract.allowProductionAnalytics, false);
  assert.equal(contract.leadProvider, "mock");
});

test("maps Vercel Production runtime to production capabilities", () => {
  const contract = createEnvironmentContractFromRuntimeEnv({
    VERCEL_ENV: "production",
    MODE: "production",
    SUPABASE_SERVICE_ROLE_KEY: "present",
  });

  assert.equal(contract.runtime, "production");
  assert.equal(contract.isProduction, true);
  assert.equal(contract.allowProductionAnalytics, true);
  assert.equal(contract.leadProvider, "production");
});

test("rejects privileged service-role credential in Preview", () => {
  assert.throws(
    () =>
      createEnvironmentContractFromRuntimeEnv({
        VERCEL_ENV: "preview",
        MODE: "production",
        SUPABASE_SERVICE_ROLE_KEY: "present",
      }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test("rejects new-style Supabase secret-key collection in Preview", () => {
  assert.throws(
    () =>
      createEnvironmentContractFromRuntimeEnv({
        VERCEL_ENV: "preview",
        MODE: "production",
        SUPABASE_SECRET_KEYS: "present",
      }),
    /SUPABASE_SECRET_KEYS/,
  );
});

test("rejects Atlas production ingress token in Preview", () => {
  assert.throws(
    () =>
      createEnvironmentContractFromRuntimeEnv({
        VERCEL_ENV: "preview",
        MODE: "production",
        ATLAS_INGRESS_TOKEN: "present",
      }),
    /ATLAS_INGRESS_TOKEN/,
  );
});

test("local development remains mock-only", () => {
  const contract = createEnvironmentContractFromRuntimeEnv({
    MODE: "development",
  });

  assert.equal(contract.runtime, "development");
  assert.equal(contract.leadProvider, "mock");
  assert.equal(contract.allowProductionAnalytics, false);
});

test("local production build without Vercel classification fails closed", () => {
  assert.throws(
    () =>
      createEnvironmentContractFromRuntimeEnv({
        MODE: "production",
      }),
    /could not be classified safely/,
  );
});

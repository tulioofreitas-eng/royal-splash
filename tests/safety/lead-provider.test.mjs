import assert from "node:assert/strict";
import test from "node:test";

import { createEnvironmentContract } from "../../src/safety/environment.ts";
import { resolveLeadProvider } from "../../src/safety/lead-provider.ts";

test("Preview resolves mock without initializing production provider", () => {
  const contract = createEnvironmentContract({
    vercelEnv: "preview",
    mode: "production",
  });

  let mockInitializations = 0;
  let productionInitializations = 0;

  const provider = resolveLeadProvider(contract, {
    mock: () => {
      mockInitializations += 1;
      return "mock";
    },
    production: () => {
      productionInitializations += 1;
      return "production";
    },
  });

  assert.equal(provider, "mock");
  assert.equal(mockInitializations, 1);
  assert.equal(productionInitializations, 0);
});

test("Development resolves mock without initializing production provider", () => {
  const contract = createEnvironmentContract({
    mode: "development",
  });

  let productionInitializations = 0;

  const provider = resolveLeadProvider(contract, {
    mock: () => "mock",
    production: () => {
      productionInitializations += 1;
      return "production";
    },
  });

  assert.equal(provider, "mock");
  assert.equal(productionInitializations, 0);
});

test("Test resolves mock without initializing production provider", () => {
  const contract = createEnvironmentContract({
    mode: "test",
  });

  let productionInitializations = 0;

  const provider = resolveLeadProvider(contract, {
    mock: () => "mock",
    production: () => {
      productionInitializations += 1;
      return "production";
    },
  });

  assert.equal(provider, "mock");
  assert.equal(productionInitializations, 0);
});

test("Production resolves production provider without initializing mock", () => {
  const contract = createEnvironmentContract({
    vercelEnv: "production",
    mode: "production",
  });

  let mockInitializations = 0;
  let productionInitializations = 0;

  const provider = resolveLeadProvider(contract, {
    mock: () => {
      mockInitializations += 1;
      return "mock";
    },
    production: () => {
      productionInitializations += 1;
      return "production";
    },
  });

  assert.equal(provider, "production");
  assert.equal(mockInitializations, 0);
  assert.equal(productionInitializations, 1);
});

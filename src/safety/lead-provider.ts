import type { EnvironmentContract } from "./environment.ts";

export interface LeadProviderFactories<T> {
  mock: () => T;
  production: () => T;
}

export function resolveLeadProvider<T>(
  contract: Pick<EnvironmentContract, "leadProvider">,
  factories: LeadProviderFactories<T>,
): T {
  if (contract.leadProvider === "mock") {
    return factories.mock();
  }

  if (contract.leadProvider === "production") {
    return factories.production();
  }

  throw new Error("Unsupported lead provider.");
}

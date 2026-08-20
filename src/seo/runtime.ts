import type {
  EnvironmentContract,
} from "../safety/environment.ts";
import {
  getCurrentEnvironmentContract,
} from "../safety/runtime.ts";

export const NON_PRODUCTION_ROBOTS =
  "noindex, nofollow" as const;

export function resolveSeoRobots(
  contract: Pick<EnvironmentContract, "isProduction">,
  productionRobots?: string,
): string | undefined {
  if (!contract.isProduction) {
    return NON_PRODUCTION_ROBOTS;
  }

  return productionRobots?.trim()
    ? productionRobots
    : undefined;
}

export function getCurrentSeoRobots(
  productionRobots?: string,
): string | undefined {
  return resolveSeoRobots(
    getCurrentEnvironmentContract(),
    productionRobots,
  );
}

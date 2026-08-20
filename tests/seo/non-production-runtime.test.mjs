import assert from "node:assert/strict";
import test from "node:test";

import {
  NON_PRODUCTION_ROBOTS,
  resolveSeoRobots,
} from "../../src/seo/runtime.ts";

test("Preview always resolves to noindex nofollow", () => {
  assert.equal(
    resolveSeoRobots(
      {
        isProduction: false,
      },
    ),
    NON_PRODUCTION_ROBOTS,
  );

  assert.equal(
    resolveSeoRobots(
      {
        isProduction: false,
      },
      "index, follow",
    ),
    NON_PRODUCTION_ROBOTS,
  );
});

test("Production preserves an undeclared robots policy", () => {
  assert.equal(
    resolveSeoRobots(
      {
        isProduction: true,
      },
    ),
    undefined,
  );
});

test("Production preserves an existing noindex policy", () => {
  assert.equal(
    resolveSeoRobots(
      {
        isProduction: true,
      },
      "noindex",
    ),
    "noindex",
  );
});

test("Production preserves an existing noindex nofollow policy", () => {
  assert.equal(
    resolveSeoRobots(
      {
        isProduction: true,
      },
      "noindex, nofollow",
    ),
    "noindex, nofollow",
  );
});

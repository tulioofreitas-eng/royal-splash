import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SITE_SEO_FOLLOW_POLICIES,
  SITE_SEO_INDEXING_POLICIES,
  SITE_SEO_SCHEMA_VERSION,
  SITE_SEO_SITEMAP_POLICIES,
} from "../../src/seo/index.ts";

test("site SEO contract has an explicit schema version", () => {
  assert.equal(
    SITE_SEO_SCHEMA_VERSION,
    "site-seo.v1",
  );
});

test("indexing, following and sitemap participation remain separate policies", () => {
  assert.deepEqual(
    [...SITE_SEO_INDEXING_POLICIES],
    ["index", "noindex"],
  );

  assert.deepEqual(
    [...SITE_SEO_FOLLOW_POLICIES],
    ["follow", "nofollow"],
  );

  assert.deepEqual(
    [...SITE_SEO_SITEMAP_POLICIES],
    ["include", "exclude"],
  );
});

test("page SEO definition keeps metadata and canonical identity explicit", async () => {
  const source = await readFile(
    new URL(
      "../../src/seo/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteSeoDefinition\s*{/,
  );

  assert.match(
    source,
    /\bschemaVersion:\s*typeof SITE_SEO_SCHEMA_VERSION;/,
  );

  assert.match(source, /\bpageRef:\s*string;/);
  assert.match(source, /\btitle:\s*string;/);
  assert.match(source, /\bdescription:\s*string;/);
  assert.match(source, /\bcanonicalRef\?:\s*string;/);
});

test("crawl and discovery policies are explicit instead of inferred from each other", async () => {
  const source = await readFile(
    new URL(
      "../../src/seo/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /\bindexing:\s*SiteSeoIndexingPolicy;/,
  );

  assert.match(
    source,
    /\bfollowing:\s*SiteSeoFollowPolicy;/,
  );

  assert.match(
    source,
    /\bsitemap:\s*SiteSeoSitemapPolicy;/,
  );
});

test("structured data is referenced without embedding Royal-specific schema objects", async () => {
  const source = await readFile(
    new URL(
      "../../src/seo/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /\bstructuredDataRefs\?:\s*readonly string\[\];/,
  );
});

test("SEO contract remains provider, renderer and Royal independent", async () => {
  const source = await readFile(
    new URL(
      "../../src/seo/contracts.ts",
      import.meta.url,
    ),
    "utf8",
  );

  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(executableSource, /\bRoyal\b/i);
  assert.doesNotMatch(executableSource, /royalsplash/i);
  assert.doesNotMatch(executableSource, /schema\.org/i);
  assert.doesNotMatch(executableSource, /LocalBusiness/i);
  assert.doesNotMatch(executableSource, /googletagmanager/i);
  assert.doesNotMatch(executableSource, /\bgtm\b/i);
  assert.doesNotMatch(executableSource, /\bga4\b/i);
  assert.doesNotMatch(executableSource, /\bfetch\s*\(/i);
  assert.doesNotMatch(executableSource, /process\.env/i);
  assert.doesNotMatch(executableSource, /import\.meta\.env/i);

  assert.doesNotMatch(
    executableSource,
    /from\s+["'][^"']*astro[^"']*["']/i,
  );
});

/**
 * Provider- and renderer-independent SEO contracts for Site Engine.
 *
 * These contracts describe page search metadata and discovery policies
 * without owning Astro rendering, sitemap generation, structured-data
 * implementation or any brand-specific SEO content.
 */

export const SITE_SEO_SCHEMA_VERSION =
  "site-seo.v1" as const;

export const SITE_SEO_INDEXING_POLICIES = [
  "index",
  "noindex",
] as const;

export type SiteSeoIndexingPolicy =
  (typeof SITE_SEO_INDEXING_POLICIES)[number];

export const SITE_SEO_FOLLOW_POLICIES = [
  "follow",
  "nofollow",
] as const;

export type SiteSeoFollowPolicy =
  (typeof SITE_SEO_FOLLOW_POLICIES)[number];

export const SITE_SEO_SITEMAP_POLICIES = [
  "include",
  "exclude",
] as const;

export type SiteSeoSitemapPolicy =
  (typeof SITE_SEO_SITEMAP_POLICIES)[number];

export interface SiteSeoDefinition {
  schemaVersion: typeof SITE_SEO_SCHEMA_VERSION;
  pageRef: string;
  title: string;
  description: string;
  canonicalRef?: string;
  indexing: SiteSeoIndexingPolicy;
  following: SiteSeoFollowPolicy;
  sitemap: SiteSeoSitemapPolicy;
  structuredDataRefs?: readonly string[];
}

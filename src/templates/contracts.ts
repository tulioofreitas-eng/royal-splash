/**
 * Provider-independent Site Engine contracts for page and template selection.
 *
 * This module defines composition identity and route-to-template selection only.
 *
 * It must not depend on:
 * - Astro rendering;
 * - presentation components;
 * - Supabase;
 * - Atlas;
 * - GTM / GA4;
 * - lead providers;
 * - Royal-specific page content.
 *
 * Existing pages are not migrated by this contract.
 */

export const PAGE_TEMPLATE_FAMILIES = [
  "site",
  "landing",
] as const;

export type PageTemplateFamily =
  (typeof PAGE_TEMPLATE_FAMILIES)[number];

export const PAGE_OWNERSHIP_MODES = [
  "site_engine",
  "shared_site_growth",
] as const;

export type PageOwnershipMode =
  (typeof PAGE_OWNERSHIP_MODES)[number];

export interface PageTemplateDefinition {
  id: string;
  family: PageTemplateFamily;
}

export interface PageRouteDefinition {
  route: string;
  templateRef: string;
  contentRef?: string;
  ownership: PageOwnershipMode;
}

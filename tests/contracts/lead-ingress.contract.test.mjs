import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  LEAD_CONSENT_STATES,
  LEAD_INGRESS_CHANNELS,
  SITE_LEAD_SCHEMA_VERSION,
} from "../../src/domains/leads/index.ts";

test("site lead contract has an explicit schema version", () => {
  assert.equal(SITE_LEAD_SCHEMA_VERSION, "site-lead.v1");
});

test("lead ingress channels describe site surfaces, not provider origins", () => {
  assert.deepEqual([...LEAD_INGRESS_CHANNELS], [
    "site_form",
    "landing_form",
    "whatsapp",
  ]);
});

test("consent distinguishes explicit grant from missing normalized evidence", () => {
  assert.deepEqual([...LEAD_CONSENT_STATES], [
    "granted",
    "not_recorded",
  ]);
});

test("normalized lead keeps contact, interest, acquisition and consent explicit", async () => {
  const source = await readFile(
    new URL("../../src/domains/leads/contracts.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteLeadContact\s*{/,
  );
  assert.match(source, /\bname:\s*string;/);
  assert.match(source, /\bemail\?:\s*string;/);
  assert.match(source, /\bphone\?:\s*string;/);

  assert.match(
    source,
    /export interface SiteLeadInterest\s*{/,
  );
  assert.match(source, /\bserviceRef\?:\s*string;/);
  assert.match(source, /\bdescription\?:\s*string;/);

  assert.match(
    source,
    /export interface SiteLeadAcquisitionContext\s*{/,
  );
  assert.match(source, /\bingressChannel:\s*LeadIngressChannel;/);
  assert.match(source, /\bsource\?:\s*string;/);
  assert.match(source, /\bcampaignRef\?:\s*string;/);
  assert.match(source, /\bpageRef\?:\s*string;/);

  assert.match(
    source,
    /export interface SiteLeadConsent\s*{/,
  );
  assert.match(source, /\bstate:\s*LeadConsentState;/);
  assert.match(source, /\bpolicyRef\?:\s*string;/);
  assert.match(source, /\bcapturedAt\?:\s*string;/);

  assert.match(
    source,
    /export interface SiteLeadIngress\s*{/,
  );
  assert.match(
    source,
    /\bschemaVersion:\s*typeof SITE_LEAD_SCHEMA_VERSION;/,
  );
  assert.match(source, /\bsubmissionRef:\s*string;/);
  assert.match(source, /\bcontact:\s*SiteLeadContact;/);
  assert.match(source, /\bcity\?:\s*string;/);
  assert.match(source, /\binterest\?:\s*SiteLeadInterest;/);
  assert.match(source, /\bmessage\?:\s*string;/);
  assert.match(
    source,
    /\bacquisition:\s*SiteLeadAcquisitionContext;/,
  );
  assert.match(source, /\bconsent:\s*SiteLeadConsent;/);
});

test("lead ingress port defines delivery boundary without owning provider implementation", async () => {
  const source = await readFile(
    new URL("../../src/domains/leads/contracts.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /export interface SiteLeadIngressPort\s*{/,
  );

  assert.match(
    source,
    /\bsubmit\(lead:\s*SiteLeadIngress\):\s*Promise<void>;/,
  );
});

test("lead domain executable contract is provider and rendering independent", async () => {
  const source = await readFile(
    new URL("../../src/domains/leads/contracts.ts", import.meta.url),
    "utf8",
  );

  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(
    executableSource,
    /from\s+["'][^"']*astro[^"']*["']/i,
  );

  assert.doesNotMatch(executableSource, /supabase/i);
  assert.doesNotMatch(executableSource, /formspree/i);
  assert.doesNotMatch(executableSource, /starterfunnels/i);
  assert.doesNotMatch(executableSource, /leadconnector/i);
  assert.doesNotMatch(executableSource, /msgsndr/i);
  assert.doesNotMatch(executableSource, /googletagmanager/i);
  assert.doesNotMatch(executableSource, /gtm-/i);

  assert.doesNotMatch(
    executableSource,
    /createProductionSupabaseClient|EMPRESA_ID|from\(["']leads["']\)/,
  );
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PAGE_OWNERSHIP_MODES,
  PAGE_TEMPLATE_FAMILIES,
} from "../../src/templates/index.ts";

test("page template families distinguish institutional site and landing composition", () => {
  assert.deepEqual([...PAGE_TEMPLATE_FAMILIES], [
    "site",
    "landing",
  ]);
});

test("page ownership keeps Site Engine and shared Growth boundary explicit", () => {
  assert.deepEqual([...PAGE_OWNERSHIP_MODES], [
    "site_engine",
    "shared_site_growth",
  ]);
});

test("page/template contracts remain provider and rendering independent", async () => {
  const source = await readFile(
    new URL("../../src/templates/contracts.ts", import.meta.url),
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
  assert.doesNotMatch(executableSource, /\batlas\b/i);
  assert.doesNotMatch(executableSource, /formspree/i);
  assert.doesNotMatch(executableSource, /starterfunnels/i);
  assert.doesNotMatch(executableSource, /leadconnector/i);
  assert.doesNotMatch(executableSource, /msgsndr/i);
  assert.doesNotMatch(executableSource, /googletagmanager/i);
  assert.doesNotMatch(executableSource, /gtm-/i);

  assert.doesNotMatch(
    executableSource,
    /components\/(Header|Footer|LPHeader|LPFooter|Formulario|FormularioGHL)/i,
  );
});

test("page route contract keeps route, template selection and content reference explicit", async () => {
  const source = await readFile(
    new URL("../../src/templates/contracts.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /export interface PageRouteDefinition\s*{/,
  );

  assert.match(source, /\broute:\s*string;/);
  assert.match(source, /\btemplateRef:\s*string;/);
  assert.match(source, /\bcontentRef\?:\s*string;/);
  assert.match(source, /\bownership:\s*PageOwnershipMode;/);
});

test("template definition is composition identity, not provider implementation", async () => {
  const source = await readFile(
    new URL("../../src/templates/contracts.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /export interface PageTemplateDefinition\s*{/,
  );

  assert.match(source, /\bid:\s*string;/);
  assert.match(source, /\bfamily:\s*PageTemplateFamily;/);
});

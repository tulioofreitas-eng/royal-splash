import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  InMemoryLeadIngressAdapter,
} from "../../src/integrations/leads/in-memory.ts";

function createLead(overrides = {}) {
  return {
    schemaVersion: "site-lead.v1",
    contact: {
      name: "Lead Teste",
      email: "lead@example.com",
    },
    acquisition: {
      ingressChannel: "site_form",
    },
    consent: {
      state: "granted",
    },
    ...overrides,
  };
}

test("in-memory adapter starts with no submitted leads", () => {
  const adapter = new InMemoryLeadIngressAdapter();

  assert.deepEqual(adapter.getSubmittedLeads(), []);
});

test("in-memory adapter accepts normalized Site lead ingress", async () => {
  const adapter = new InMemoryLeadIngressAdapter();
  const lead = createLead();

  const receipt = await adapter.submit(lead);

  assert.deepEqual(adapter.getSubmittedLeads(), [lead]);
  assert.deepEqual(receipt, { mock: true });
});

test("in-memory adapter preserves submission order", async () => {
  const adapter = new InMemoryLeadIngressAdapter();

  const first = createLead({
    contact: {
      name: "Primeiro Lead",
      phone: "21999990001",
    },
  });

  const second = createLead({
    contact: {
      name: "Segundo Lead",
      email: "segundo@example.com",
    },
    acquisition: {
      ingressChannel: "landing_form",
      campaignRef: "campaign-test",
    },
  });

  await adapter.submit(first);
  await adapter.submit(second);

  assert.deepEqual(adapter.getSubmittedLeads(), [
    first,
    second,
  ]);
});

test("submitted lead snapshots cannot mutate the adapter collection", async () => {
  const adapter = new InMemoryLeadIngressAdapter();

  await adapter.submit(createLead());

  const snapshot = adapter.getSubmittedLeads();
  snapshot.push?.(createLead({
    contact: {
      name: "Tentativa externa",
    },
  }));

  assert.equal(adapter.getSubmittedLeads().length, 1);
});

test("adapter explicitly implements the SiteLeadIngressPort boundary", async () => {
  const source = await readFile(
    new URL(
      "../../src/integrations/leads/in-memory.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /implements\s+SiteLeadIngressPort/,
  );

  assert.match(
    source,
    /submit\([\s\S]*?lead:\s*SiteLeadIngress,[\s\S]*?\):\s*Promise<SiteLeadIngressReceipt>/,
  );
});

test("in-memory adapter has no external provider or runtime dependency", async () => {
  const source = await readFile(
    new URL(
      "../../src/integrations/leads/in-memory.ts",
      import.meta.url,
    ),
    "utf8",
  );

  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(executableSource, /supabase/i);
  assert.doesNotMatch(executableSource, /\batlas\b/i);
  assert.doesNotMatch(executableSource, /formspree/i);
  assert.doesNotMatch(executableSource, /starterfunnels/i);
  assert.doesNotMatch(executableSource, /leadconnector/i);
  assert.doesNotMatch(executableSource, /msgsndr/i);
  assert.doesNotMatch(executableSource, /\bfetch\s*\(/i);
  assert.doesNotMatch(executableSource, /process\.env/i);
  assert.doesNotMatch(executableSource, /import\.meta\.env/i);

  assert.doesNotMatch(
    executableSource,
    /from\s+["'][^"']*astro[^"']*["']/i,
  );
});

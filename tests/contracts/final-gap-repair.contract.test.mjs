import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Home hero CTA row entrance uses opacity-only animation, never visibility-hiding autoAlpha", async () => {
  const source = await readFile("src/components/motion/ExperienceMotion.astro", "utf8");

  const heroActionsLine = source
    .split("\n")
    .find((line) => line.includes("heroActions") && line.includes("heroTimeline.fromTo"));

  assert.ok(heroActionsLine, "heroActions entrance tween must exist");
  assert.match(heroActionsLine, /\{ opacity: 0, y: 16 \}/);
  assert.match(heroActionsLine, /\{ opacity: 1, y: 0, duration: 0\.6 \}/);
  assert.doesNotMatch(heroActionsLine, /autoAlpha/);
});

test("ProjectStartForm dispatches site:lead-submitted only after confirmed Atlas success, without PII", async () => {
  const source = await readFile("src/components/site/ProjectStartForm.astro", "utf8");

  const okCheckIndex = source.indexOf('if (!response.ok) throw new Error("Submission failed");');
  const dispatchIndex = source.indexOf('new CustomEvent("site:lead-submitted"');
  const fallbackIndex = source.indexOf("[data-whatsapp-fallback]");
  const catchIndex = source.indexOf("} catch (e) {");

  assert.ok(okCheckIndex !== -1, "response.ok guard must exist");
  assert.ok(dispatchIndex !== -1, "site:lead-submitted dispatch must exist");
  assert.ok(catchIndex !== -1, "catch block must exist");

  // Dispatch must occur strictly after the success guard, and strictly
  // inside the try block (before the catch), so a thrown/failed request
  // never reaches it.
  assert.ok(
    dispatchIndex > okCheckIndex,
    "dispatch must be placed after the response.ok success guard",
  );
  assert.ok(
    dispatchIndex < catchIndex,
    "dispatch must be inside the try block, not reachable from catch",
  );

  // Only one dispatch call in the whole component (no duplicate emission).
  const dispatchOccurrences = source.split('new CustomEvent("site:lead-submitted"').length - 1;
  assert.equal(dispatchOccurrences, 1);

  // Only one POST to the Atlas seam (no parallel/duplicate submission path).
  const fetchOccurrences = source.split('fetch("/api/site-lead"').length - 1;
  assert.equal(fetchOccurrences, 1);

  const detail = source.slice(dispatchIndex, fallbackIndex);
  assert.match(detail, /componentRef:\s*"project_start_form"/);
  assert.match(detail, /subjectRef:\s*mappedContext/);
  assert.match(detail, /channelRef:\s*"site_form"/);

  // No PII field names leak into the analytics detail payload.
  for (const forbidden of ["fields.nome", "fields.email", "fields.telefone", "fields.cidade", "name:", "email:", "phone:", "city:"]) {
    assert.doesNotMatch(detail, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

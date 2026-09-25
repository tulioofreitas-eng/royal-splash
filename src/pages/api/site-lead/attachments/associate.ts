import type { APIRoute } from "astro";
import { associateAttachmentSession } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { isCanonicalUuid } from "../../../../integrations/leads/attachment-target.ts";
import { json, parseBoundedJson, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;
    const { body, errorResponse } = await parseBoundedJson(request);
    if (errorResponse) return errorResponse;

    const { sessionId, intakeId, idempotencyKey } = body ?? {};
    if (!isCanonicalUuid(sessionId) || !isCanonicalUuid(intakeId) || typeof idempotencyKey !== "string" || !idempotencyKey) {
      return json({ error: "invalid_payload" }, 400);
    }

    const data = await associateAttachmentSession(sessionId, intakeId, idempotencyKey);
    return json({
      sessionId: data.sessionId ?? sessionId,
      intakeId: data.intakeId ?? intakeId,
      state: data.state ?? "associated",
      idempotent: data.idempotent,
    });
  } catch {
    console.error("royal_attachment_associate_failed");
    return json({ error: "attachment_associate_failed" }, 503);
  }
};

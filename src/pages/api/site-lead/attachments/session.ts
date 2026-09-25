import type { APIRoute } from "astro";
import { createAttachmentSession } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { isCanonicalUuid } from "../../../../integrations/leads/attachment-target.ts";
import { json, parseBoundedJson, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;
    const { body, errorResponse } = await parseBoundedJson(request);
    if (errorResponse) return errorResponse;

    const { intakeId, idempotencyKey } = body ?? {};
    if (!isCanonicalUuid(intakeId) || typeof idempotencyKey !== "string" || !idempotencyKey) {
      return json({ error: "invalid_payload" }, 400);
    }

    const data = await createAttachmentSession(intakeId, idempotencyKey);
    return json({
      sessionId: data.sessionId,
      intakeId: data.intakeId,
      expiresAt: data.expiresAt,
      state: data.state,
      fileCount: data.fileCount,
      aggregateBytes: data.aggregateBytes,
    });
  } catch {
    console.error("royal_attachment_session_failed");
    return json({ error: "attachment_session_failed" }, 503);
  }
};

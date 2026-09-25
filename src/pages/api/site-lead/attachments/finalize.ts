import type { APIRoute } from "astro";
import { finalizeAttachmentSession } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { isCanonicalUuid } from "../../../../integrations/leads/attachment-target.ts";
import { json, parseBoundedJson, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;
    const { body, errorResponse } = await parseBoundedJson(request);
    if (errorResponse) return errorResponse;

    const { sessionId, idempotencyKey } = body ?? {};
    if (!isCanonicalUuid(sessionId) || typeof idempotencyKey !== "string" || !idempotencyKey) {
      return json({ error: "invalid_payload" }, 400);
    }

    const data = await finalizeAttachmentSession(sessionId, idempotencyKey);
    if (data.readyForBinding !== true) return json({ error: "session_not_ready" }, 422);

    return json({
      sessionId: data.sessionId,
      state: data.state,
      readyForBinding: data.readyForBinding,
      idempotent: data.idempotent,
    });
  } catch {
    console.error("royal_attachment_finalize_failed");
    return json({ error: "attachment_finalize_failed" }, 503);
  }
};

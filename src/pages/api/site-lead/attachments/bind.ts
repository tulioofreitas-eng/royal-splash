import type { APIRoute } from "astro";
import { bindAttachmentSession } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { isCanonicalUuid } from "../../../../integrations/leads/attachment-target.ts";
import { json, parseBoundedJson, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;
    const { body, errorResponse } = await parseBoundedJson(request);
    if (errorResponse) return errorResponse;

    const { sessionId, intakeId, fileIds, idempotencyKey } = body ?? {};
    if (
      !isCanonicalUuid(sessionId) ||
      !isCanonicalUuid(intakeId) ||
      !Array.isArray(fileIds) ||
      fileIds.length === 0 ||
      fileIds.some((fileId) => !isCanonicalUuid(fileId)) ||
      typeof idempotencyKey !== "string" ||
      !idempotencyKey
    ) {
      return json({ error: "invalid_payload" }, 400);
    }

    const data = await bindAttachmentSession(sessionId, intakeId, fileIds, idempotencyKey);
    return json({
      sessionId: data.sessionId ?? sessionId,
      intakeId: data.intakeId ?? intakeId,
      state: data.state ?? "bound",
      idempotent: data.idempotent,
    });
  } catch {
    console.error("royal_attachment_bind_failed");
    return json({ error: "attachment_bind_failed" }, 503);
  }
};

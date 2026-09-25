import type { APIRoute } from "astro";
import { confirmAttachmentFile } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { isCanonicalUuid } from "../../../../integrations/leads/attachment-target.ts";
import { json, parseBoundedJson, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;
    const { body, errorResponse } = await parseBoundedJson(request);
    if (errorResponse) return errorResponse;

    const { sessionId, fileId, idempotencyKey } = body ?? {};
    if (!isCanonicalUuid(sessionId) || !isCanonicalUuid(fileId) || typeof idempotencyKey !== "string" || !idempotencyKey) {
      return json({ error: "invalid_payload" }, 400);
    }

    const data = await confirmAttachmentFile(sessionId, fileId, idempotencyKey);
    return json({ fileId: data.fileId, state: data.state, idempotent: data.idempotent });
  } catch {
    console.error("royal_attachment_confirm_failed");
    return json({ error: "attachment_confirm_failed" }, 503);
  }
};

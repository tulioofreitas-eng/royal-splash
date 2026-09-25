import type { APIRoute } from "astro";
import { validateRoyalAttachmentFile } from "../../../../domain/attachments/policy.ts";
import { authorizeAttachmentFile } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { isCanonicalUuid } from "../../../../integrations/leads/attachment-target.ts";
import { json, parseBoundedJson, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;
    const { body, errorResponse } = await parseBoundedJson(request);
    if (errorResponse) return errorResponse;

    const { sessionId, fileName, size, mime, idempotencyKey } = body ?? {};
    if (
      !isCanonicalUuid(sessionId) ||
      typeof fileName !== "string" ||
      !Number.isSafeInteger(size) ||
      typeof idempotencyKey !== "string" ||
      !idempotencyKey ||
      (mime !== null && mime !== undefined && typeof mime !== "string")
    ) {
      return json({ error: "invalid_payload" }, 400);
    }

    const validation = validateRoyalAttachmentFile(fileName, size, mime);
    if (!validation.valid) return json({ error: validation.error ?? "file_policy_rejected" }, 422);

    const data = await authorizeAttachmentFile(
      sessionId,
      { fileName, size, mime, idempotencyKey },
      idempotencyKey,
    );

    return json({
      fileId: data.fileId,
      sessionId: data.sessionId,
      bucket: data.bucket,
      path: data.path,
      token: data.token,
      state: data.state,
      idempotent: data.idempotent,
    });
  } catch {
    console.error("royal_attachment_authorize_failed");
    return json({ error: "attachment_authorize_failed" }, 503);
  }
};

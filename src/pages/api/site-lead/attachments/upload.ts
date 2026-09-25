import type { APIRoute } from "astro";
import { getAttachmentStorageBucket, getAttachmentStorageUrl } from "../../../../integrations/leads/atlas-site-origin-attachments.ts";
import { deriveSignedUploadTarget, isCanonicalUuid, matchesDerivedUploadTarget } from "../../../../integrations/leads/attachment-target.ts";
import { json, productionOnly } from "./utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const blocked = productionOnly();
    if (blocked) return blocked;

    const sessionId = request.headers.get("x-atlas-upload-session-id");
    const fileId = request.headers.get("x-atlas-upload-file-id");
    const uploadToken = request.headers.get("x-atlas-upload-token");
    const suppliedBucket = request.headers.get("x-atlas-upload-bucket");
    const suppliedPath = request.headers.get("x-atlas-upload-path");

    if (!isCanonicalUuid(sessionId) || !isCanonicalUuid(fileId) || !uploadToken) {
      return json({ error: "invalid_upload_headers" }, 400);
    }

    const storageBucket = getAttachmentStorageBucket();
    if (!matchesDerivedUploadTarget(storageBucket, sessionId, fileId, suppliedBucket, suppliedPath)) {
      return json({ error: "upload_target_mismatch" }, 403);
    }

    const expected = deriveSignedUploadTarget(storageBucket, sessionId, fileId);
    if (!expected) return json({ error: "invalid_upload_target" }, 400);

    const providerUrl =
      `${getAttachmentStorageUrl()}/storage/v1/object/upload/sign/${expected.bucket}/${expected.path}?token=${encodeURIComponent(uploadToken)}`;

    const uploadResponse = await fetch(providerUrl, {
      method: "PUT",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/octet-stream",
        "x-upsert": "false",
        "cache-control": "max-age=3600",
      },
      body: request.body,
      duplex: "half",
    } as RequestInit);

    if (!uploadResponse.ok) {
      return json({ error: "storage_upload_failed" }, uploadResponse.status);
    }

    return json({ ok: true });
  } catch {
    console.error("royal_attachment_upload_proxy_failed");
    return json({ error: "attachment_upload_failed" }, 503);
  }
};

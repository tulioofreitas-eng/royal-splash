function requiredEnv(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing required runtime configuration: ${name}`);
  return normalized;
}

function baseUrl(): string {
  const value = requiredEnv("ATLAS_SITE_ORIGIN_URL", import.meta.env.ATLAS_SITE_ORIGIN_URL).replace(/\/+$/, "");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Invalid Atlas Site-Origin URL");
  }
  return value;
}

function token(): string {
  return requiredEnv("ATLAS_INGRESS_TOKEN", import.meta.env.ATLAS_INGRESS_TOKEN);
}

export function getAttachmentStorageUrl(): string {
  const value = requiredEnv("ATLAS_STORAGE_URL", import.meta.env.ATLAS_STORAGE_URL).replace(/\/+$/, "");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Invalid Atlas storage URL");
  }
  return value;
}

export function getAttachmentStorageBucket(): string {
  return requiredEnv("ATLAS_STORAGE_BUCKET", import.meta.env.ATLAS_STORAGE_BUCKET);
}

async function parseBoundedResponseJson(response: Response, limitBytes = 128 * 1024): Promise<any> {
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > limitBytes) throw new Error("Atlas attachment response too large");
  return JSON.parse(new TextDecoder().decode(buffer));
}

async function atlasPost(
  path: string,
  body: Record<string, unknown> | undefined,
  idempotencyKey: string,
): Promise<any> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Idempotency-Key": idempotencyKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) throw new Error(`Atlas attachment request failed: ${response.status}`);
  return parseBoundedResponseJson(response);
}

export function createAttachmentSession(intakeId: string, idempotencyKey: string) {
  return atlasPost("/api/intake/site-origin/attachments/sessions", { intakeId, idempotencyKey }, idempotencyKey);
}

export function authorizeAttachmentFile(
  sessionId: string,
  file: { fileName: string; size: number; mime?: string | null; idempotencyKey: string },
  idempotencyKey: string,
) {
  return atlasPost(
    `/api/intake/site-origin/attachments/sessions/${sessionId}/files/authorize`,
    file,
    idempotencyKey,
  );
}

export function confirmAttachmentFile(sessionId: string, fileId: string, idempotencyKey: string) {
  return atlasPost(
    `/api/intake/site-origin/attachments/sessions/${sessionId}/files/${fileId}/confirm`,
    undefined,
    idempotencyKey,
  );
}

export function finalizeAttachmentSession(sessionId: string, idempotencyKey: string) {
  return atlasPost(
    `/api/intake/site-origin/attachments/sessions/${sessionId}/finalize`,
    { idempotencyKey },
    idempotencyKey,
  );
}

export function associateAttachmentSession(sessionId: string, intakeId: string, idempotencyKey: string) {
  return atlasPost(
    `/api/intake/site-origin/attachments/sessions/${sessionId}/intake`,
    { intakeId, idempotencyKey },
    idempotencyKey,
  );
}

export function bindAttachmentSession(
  sessionId: string,
  intakeId: string,
  fileIds: string[],
  idempotencyKey: string,
) {
  return atlasPost(
    `/api/intake/site-origin/attachments/sessions/${sessionId}/bind`,
    { intakeId, fileIds, idempotencyKey },
    idempotencyKey,
  );
}

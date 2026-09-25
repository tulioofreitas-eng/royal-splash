export function isCanonicalUuid(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function deriveSignedUploadTarget(
  storageBucket: string | undefined | null,
  sessionId: string | undefined | null,
  fileId: string | undefined | null,
): { bucket: string; path: string } | null {
  if (!storageBucket || !isCanonicalUuid(sessionId) || !isCanonicalUuid(fileId)) return null;
  return { bucket: storageBucket, path: `staging/${sessionId}/${fileId}` };
}

export function matchesDerivedUploadTarget(
  storageBucket: string | undefined | null,
  sessionId: string | undefined | null,
  fileId: string | undefined | null,
  suppliedBucket: string | undefined | null,
  suppliedPath: string | undefined | null,
): boolean {
  const expected = deriveSignedUploadTarget(storageBucket, sessionId, fileId);
  if (!expected) return false;
  if (suppliedBucket != null && suppliedBucket !== expected.bucket) return false;
  if (suppliedPath != null && suppliedPath !== expected.path) return false;
  return true;
}

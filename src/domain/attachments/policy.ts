export const ROYAL_ATTACHMENT_POLICY = {
  ALLOWED_EXTENSIONS: ["pdf", "jpg", "jpeg", "png", "webp"],
  EXTENSION_MIME_MAP: {
    pdf: ["application/pdf"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"],
  } as Record<string, string[]>,
  MAX_ATTACHMENT_COUNT: 10,
  MAX_ATTACHMENT_BYTES: 50 * 1024 * 1024,
  MAX_ATTACHMENT_TOTAL_BYTES: 200 * 1024 * 1024,
} as const;

export function validateRoyalAttachmentFile(
  filename: string,
  size: number,
  mime?: string | null,
): { valid: boolean; error?: string } {
  if (!Number.isSafeInteger(size) || size <= 0) {
    return { valid: false, error: "Arquivo com tamanho inválido." };
  }

  if (size > ROYAL_ATTACHMENT_POLICY.MAX_ATTACHMENT_BYTES) {
    return { valid: false, error: "Cada arquivo pode ter no máximo 50 MB." };
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ROYAL_ATTACHMENT_POLICY.ALLOWED_EXTENSIONS.some((allowed) => allowed === extension)) {
    return { valid: false, error: "Formato não permitido. Use PDF, JPG, PNG ou WEBP." };
  }

  const allowedMimes = ROYAL_ATTACHMENT_POLICY.EXTENSION_MIME_MAP[extension];
  const normalizedMime = mime?.trim().toLowerCase();
  if (normalizedMime && allowedMimes && !allowedMimes.includes(normalizedMime)) {
    return { valid: false, error: "O tipo do arquivo não corresponde à extensão informada." };
  }

  return { valid: true };
}

export function validateRoyalAttachmentSet(
  files: Array<{ name: string; size: number; type?: string | null }>,
): { valid: boolean; error?: string } {
  if (files.length > ROYAL_ATTACHMENT_POLICY.MAX_ATTACHMENT_COUNT) {
    return {
      valid: false,
      error: `Envie no máximo ${ROYAL_ATTACHMENT_POLICY.MAX_ATTACHMENT_COUNT} arquivos.`,
    };
  }

  let totalBytes = 0;
  for (const file of files) {
    const result = validateRoyalAttachmentFile(file.name, file.size, file.type);
    if (!result.valid) return result;
    totalBytes += file.size;
  }

  if (totalBytes > ROYAL_ATTACHMENT_POLICY.MAX_ATTACHMENT_TOTAL_BYTES) {
    return { valid: false, error: "O conjunto de arquivos pode ter no máximo 200 MB." };
  }

  return { valid: true };
}

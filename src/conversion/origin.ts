export interface ConversionOrigin {
  source?: string;
  pageRef?: string;
}

const SOURCE_REF_PATTERN =
  /^[a-z][a-z0-9_]{0,63}$/;

const PAGE_REF_PATTERN =
  /^\/[a-z0-9/_-]*$/;

export function normalizeConversionSourceRef(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    !SOURCE_REF_PATTERN.test(
      normalized,
    )
  ) {
    return undefined;
  }

  return normalized;
}

export function normalizeConversionPageRef(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length > 255 ||
    normalized.startsWith("//") ||
    normalized.includes("?") ||
    normalized.includes("#") ||
    !PAGE_REF_PATTERN.test(
      normalized,
    )
  ) {
    return undefined;
  }

  return normalized;
}

export function normalizeConversionOrigin(
  input: {
    source: unknown;
    pageRef: unknown;
  },
): ConversionOrigin {
  const source =
    normalizeConversionSourceRef(
      input.source,
    );

  const pageRef =
    normalizeConversionPageRef(
      input.pageRef,
    );

  if (!source || !pageRef) {
    return {};
  }

  return {
    source,
    pageRef,
  };
}

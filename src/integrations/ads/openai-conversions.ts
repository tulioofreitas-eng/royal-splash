const OPENAI_ADS_PIXEL_ID = "G7za354ukz8KMXzFt6Vayr";
const OPENAI_CONVERSIONS_ENDPOINT =
  `https://bzr.openai.com/v1/events?pid=${OPENAI_ADS_PIXEL_ID}`;
const ROYAL_ORIGIN = "https://www.royalsplash.com.br";
const OPENAI_CONVERSIONS_TIMEOUT_MS = 1800;

type FetchLike = typeof fetch;

interface OpenAILeadCreatedInput {
  apiKey?: string;
  submissionRef: string;
  pageRef: string;
  marketingConsent: boolean;
  cookieHeader?: string | null;
  fetchImpl?: FetchLike;
  nowMs?: number;
}

export type OpenAILeadCreatedResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_key" | "no_marketing_consent" }
  | { status: "failed"; httpStatus?: number };

function parseCookie(
  cookieHeader: string | null | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...rest] = segment.trim().split("=");

    if (rawName !== name || rest.length === 0) continue;

    const rawValue = rest.join("=");

    try {
      const decoded = decodeURIComponent(rawValue).trim();
      return decoded || undefined;
    } catch {
      const trimmed = rawValue.trim();
      return trimmed || undefined;
    }
  }

  return undefined;
}

function normalizePageRef(pageRef: string): string {
  const trimmed = pageRef.trim();

  if (!trimmed.startsWith("/") || trimmed.includes("://")) {
    return "/";
  }

  return trimmed;
}

export async function sendOpenAILeadCreated(
  input: OpenAILeadCreatedInput,
): Promise<OpenAILeadCreatedResult> {
  const apiKey = input.apiKey?.trim();

  if (!apiKey) {
    return { status: "skipped", reason: "missing_key" };
  }

  if (!input.marketingConsent) {
    return { status: "skipped", reason: "no_marketing_consent" };
  }

  const eventId = input.submissionRef.trim();
  if (!eventId) {
    return { status: "failed" };
  }

  const pageRef = normalizePageRef(input.pageRef);
  const oppref = parseCookie(input.cookieHeader, "__oppref");
  const obref = parseCookie(input.cookieHeader, "__obref");
  const fetchImpl = input.fetchImpl ?? fetch;

  const event: Record<string, unknown> = {
    id: eventId,
    type: "lead_created",
    timestamp_ms: input.nowMs ?? Date.now(),
    source_url: `${ROYAL_ORIGIN}${pageRef}`,
    action_source: "web",
    data: {
      type: "customer_action",
    },
  };

  if (oppref) {
    event.oppref = oppref;
  }

  if (obref) {
    event.user = { obref };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    OPENAI_CONVERSIONS_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(
      OPENAI_CONVERSIONS_ENDPOINT,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          validate_only: false,
          events: [event],
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return {
        status: "failed",
        httpStatus: response.status,
      };
    }

    return { status: "sent" };
  } catch {
    return { status: "failed" };
  } finally {
    clearTimeout(timeout);
  }
}

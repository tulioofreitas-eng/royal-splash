export const prerender = false;

import type { APIRoute } from "astro";
import {
  SITE_LEAD_SCHEMA_VERSION,
} from "../../domains/leads/contracts.ts";
import {
  AtlasPayloadValidationError,
} from "../../integrations/leads/atlas-site-origin-payload.ts";
import {
  AtlasSiteOriginAdapter,
  AtlasSiteOriginError,
} from "../../integrations/leads/atlas-site-origin.ts";
import { InMemoryLeadIngressAdapter } from "../../integrations/leads/in-memory.ts";
import {
  InvalidSiteLeadSubmissionError,
  normalizeSiteLeadRequest,
  type SiteLeadRequestPayload,
} from "../../integrations/leads/normalize-site-lead-request.ts";
import {
  getAtlasSiteOriginConfig,
} from "../../safety/atlas-site-origin-config.ts";
import { resolveLeadProvider } from "../../safety/lead-provider.ts";
import { getCurrentEnvironmentContract } from "../../safety/runtime.ts";

const JSON_HEADERS = {
  "content-type": "application/json",
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      { error: "unsupported_media_type" },
      415,
    );
  }

  try {
    const body = (await request.json()) as SiteLeadRequestPayload;
    const lead = normalizeSiteLeadRequest(body);
    const environment = getCurrentEnvironmentContract();
    const adapter = resolveLeadProvider(environment, {
      mock: () => new InMemoryLeadIngressAdapter(),
      production: () =>
        new AtlasSiteOriginAdapter(
          getAtlasSiteOriginConfig(environment),
        ),
    });

    await adapter.submit(lead);

    return jsonResponse(
      {
        ok: true,
        ...(environment.leadProvider === "mock"
          ? {
              mock: true,
              schemaVersion: SITE_LEAD_SCHEMA_VERSION,
            }
          : {}),
      },
      environment.leadProvider === "mock" ? 200 : 201,
    );
  } catch (error) {
    if (error instanceof InvalidSiteLeadSubmissionError) {
      return jsonResponse({ error: "invalid_submission" }, 400);
    }

    if (error instanceof AtlasPayloadValidationError) {
      return jsonResponse(
        {
          error:
            error.reason === "invalid_consent" ||
            error.reason === "stale_consent"
              ? "invalid_consent"
              : "invalid_submission",
        },
        400,
      );
    }

    if (error instanceof AtlasSiteOriginError) {
      return jsonResponse(
        { error: error.visitorCode },
        error.visitorStatus,
      );
    }

    return jsonResponse({ error: "submission_failed" }, 500);
  }
};

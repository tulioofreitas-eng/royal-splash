export const prerender = false;

import type { APIRoute } from "astro";
import {
  SITE_LEAD_SCHEMA_VERSION,
} from "../../domains/leads/contracts.ts";
import { InMemoryLeadIngressAdapter } from "../../integrations/leads/in-memory.ts";
import {
  InvalidSiteLeadSubmissionError,
  normalizeSiteLeadRequest,
  type SiteLeadRequestPayload,
} from "../../integrations/leads/normalize-site-lead-request.ts";
import { getCurrentEnvironmentContract } from "../../safety/runtime.ts";

export const POST: APIRoute = async ({
  request,
}) => {
  try {
    const environment =
      getCurrentEnvironmentContract();

    if (environment.isProduction) {
      return new Response(
        JSON.stringify({
          error: "not_available",
        }),
        {
          status: 404,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    const contentType =
      request.headers.get("content-type") ?? "";

    if (
      !contentType.includes(
        "application/json",
      )
    ) {
      return new Response(
        JSON.stringify({
          error: "unsupported_media_type",
        }),
        {
          status: 415,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    const body =
      (await request.json()) as SiteLeadRequestPayload;
    const lead = normalizeSiteLeadRequest(body);

    const adapter =
      new InMemoryLeadIngressAdapter();

    await adapter.submit(lead);

    const submittedCount =
      adapter.getSubmittedLeads().length;

    return new Response(
      JSON.stringify({
        ok: true,
        mock: true,
        schemaVersion:
          SITE_LEAD_SCHEMA_VERSION,
        submittedCount,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  } catch (error) {
    if (error instanceof InvalidSiteLeadSubmissionError) {
      return new Response(
        JSON.stringify({
          error: "invalid_submission",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: "preview_ingress_error",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
};

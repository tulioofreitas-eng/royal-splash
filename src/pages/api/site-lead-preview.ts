export const prerender = false;

import type { APIRoute } from "astro";
import {
  normalizeConversionOrigin,
} from "../../conversion/origin.ts";
import {
  SITE_LEAD_SCHEMA_VERSION,
  type SiteLeadIngress,
} from "../../domains/leads/contracts.ts";
import { InMemoryLeadIngressAdapter } from "../../integrations/leads/in-memory.ts";
import { getCurrentEnvironmentContract } from "../../safety/runtime.ts";

interface PreviewIntakePayload {
  projectContext?: unknown;
  projectNeed?: unknown;
  city?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  consent?: unknown;
  source?: unknown;
  pageRef?: unknown;
}

function normalizedText(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const result = value.trim();

  return result || undefined;
}

function isClearlyValidEmail(
  value: string,
): boolean {
  const separatorIndex = value.indexOf("@");

  return (
    !/\s/.test(value) &&
    separatorIndex > 0 &&
    separatorIndex === value.lastIndexOf("@") &&
    separatorIndex < value.length - 1
  );
}

function contextLabel(
  value: string,
): string | undefined {
  if (value === "residencial") {
    return "Residencial";
  }

  if (value === "corporativo_institucional") {
    return "Corporativo / Institucional";
  }

  return undefined;
}

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
      (await request.json()) as PreviewIntakePayload;

    const projectContext =
      normalizedText(body.projectContext);
    const projectNeed =
      normalizedText(body.projectNeed);
    const city = normalizedText(body.city);
    const name = normalizedText(body.name);
    const email = normalizedText(body.email);
    const phone = normalizedText(body.phone);

    const conversionOrigin =
      normalizeConversionOrigin({
        source:
          body.source,
        pageRef:
          body.pageRef,
      });

    const context = projectContext
      ? contextLabel(projectContext)
      : undefined;

    if (
      !context ||
      !city ||
      !projectNeed ||
      !name ||
      (!email && !phone) ||
      (email && !isClearlyValidEmail(email)) ||
      body.consent !== true
    ) {
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

    const lead: SiteLeadIngress = {
      schemaVersion: SITE_LEAD_SCHEMA_VERSION,
      contact: {
        name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
      ...(city ? { city } : {}),
      interest: {
        description:
          `Contexto: ${context}. Necessidade: ${projectNeed}`,
      },
      acquisition: {
        ingressChannel: "site_form",
        ...(conversionOrigin.source
          ? {
              source:
                conversionOrigin.source,
            }
          : {}),
        pageRef:
          conversionOrigin.pageRef ??
          "/inicie-seu-projeto",
      },
      consent: {
        state: "granted",
        policyRef: "/politica-de-privacidade",
        capturedAt: new Date().toISOString(),
      },
    };

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
  } catch {
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

import { getCurrentEnvironmentContract } from "../../../../safety/runtime.ts";

export function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function parseBoundedJson(
  request: Request,
  limitBytes = 16 * 1024,
): Promise<{ body: any; errorResponse: Response | null }> {
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > limitBytes) {
    return { body: null, errorResponse: json({ error: "payload_too_large" }, 413) };
  }

  try {
    return { body: JSON.parse(new TextDecoder().decode(buffer)), errorResponse: null };
  } catch {
    return { body: null, errorResponse: json({ error: "invalid_payload" }, 400) };
  }
}

export function productionOnly(): Response | null {
  const runtime = getCurrentEnvironmentContract();
  return runtime.isProduction ? null : json({ error: "production_only" }, 404);
}

// Shared helpers for API route handlers — every route responds with the
// same `{ error }` / `{ error, details }` shape, so the construction of
// those responses lives here rather than being repeated per route.
import { NextResponse } from "next/server";

/** Route handler context for dynamic `[id]` segments. */
export type IdRouteContext = { params: Promise<{ id: string }> };

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

export function notFound(message = "Not found") {
  return errorResponse(message, 404);
}

/**
 * Logs an unexpected error and returns a 500. Pass `withDetails` for
 * endpoints whose clients surface the underlying message to the user.
 */
export function serverError(
  err: unknown,
  message: string,
  withDetails = false
) {
  console.error(err);
  const body: { error: string; details?: string } = { error: message };
  if (withDetails) {
    body.details = err instanceof Error ? err.message : "Unknown error";
  }
  return NextResponse.json(body, { status: 500 });
}

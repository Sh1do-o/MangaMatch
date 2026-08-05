// Shared helpers for API route error handling.
//
// Two problems these solve:
// 1. `await req.json()` throws on a malformed/empty body. Called outside a
//    try block it escapes the route entirely and Next.js turns it into an
//    opaque 500, which reads like a server bug rather than a bad request.
// 2. Prisma failures were all collapsed into a generic 500, so "this manga
//    id doesn't exist" and "the database is unreachable" were
//    indistinguishable to the caller.
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** An error carrying the HTTP status that should be returned for it. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "HttpError";
  }
}

/** Parses a JSON request body, turning a malformed body into a 400. */
export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch (err) {
    throw new HttpError(400, "Request body must be valid JSON", { cause: err });
  }
}

/** Parses a route param that must be a positive integer id. */
export function parseIdParam(value: string, name = "id"): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid '${name}': expected a positive integer`);
  }
  return id;
}

interface ErrorResponseOptions {
  /** Message for a 500 when the cause isn't something we recognise. */
  fallback: string;
  /** Message for a Prisma "record not found" (P2025) -> 404. */
  notFound?: string;
  /** Message for a Prisma unique constraint violation (P2002) -> 409. */
  conflict?: string;
}

/**
 * Maps a thrown error onto an HTTP response, preserving the distinction
 * between client mistakes (400/404/409) and genuine server failures (500).
 * Unexpected errors are logged with their route context so the server log
 * says which handler failed rather than just dumping a stack trace.
 */
export function errorResponse(err: unknown, options: ErrorResponseOptions) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025" || err.code === "P2016") {
      return NextResponse.json(
        { error: options.notFound ?? "Record not found" },
        { status: 404 }
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: options.conflict ?? "That record already exists" },
        { status: 409 }
      );
    }
  }

  console.error(`${options.fallback}:`, err);
  return NextResponse.json(
    {
      error: options.fallback,
      details: err instanceof Error ? err.message : String(err),
    },
    { status: 500 }
  );
}

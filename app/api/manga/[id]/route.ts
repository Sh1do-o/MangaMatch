// PATCH /api/manga/[id]   -> { readingStatus } updates reading status
// DELETE /api/manga/[id]  -> removes a manga from the library
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse, parseIdParam, parseJsonBody } from "@/lib/api";

const VALID_STATUSES = ["planning", "reading", "completed"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mangaId = parseIdParam(id);
    const body = await parseJsonBody(req);
    const { readingStatus, rating } = (body ?? {}) as {
      readingStatus?: unknown;
      rating?: unknown;
    };

    const data: { readingStatus?: string; rating?: number | null } = {};

    if (readingStatus !== undefined) {
      if (
        typeof readingStatus !== "string" ||
        !VALID_STATUSES.includes(readingStatus)
      ) {
        throw new HttpError(
          400,
          `readingStatus must be one of: ${VALID_STATUSES.join(", ")}`
        );
      }
      data.readingStatus = readingStatus;
    }

    if (rating !== undefined) {
      if (
        rating !== null &&
        (typeof rating !== "number" || rating < 1 || rating > 10)
      ) {
        throw new HttpError(
          400,
          "rating must be a number between 1 and 10, or null"
        );
      }
      data.rating = rating;
    }

    if (Object.keys(data).length === 0) {
      throw new HttpError(400, "Nothing to update: provide readingStatus and/or rating");
    }

    const manga = await prisma.manga.update({
      where: { id: mangaId },
      data,
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to update manga",
      notFound: "Manga not found",
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.manga.delete({ where: { id: parseIdParam(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to delete manga",
      notFound: "Manga not found",
    });
  }
}

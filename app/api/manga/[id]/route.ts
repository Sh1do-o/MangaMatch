// PATCH /api/manga/[id]   -> { readingStatus, rating } updates reading status or rating
// DELETE /api/manga/[id]  -> removes a manga from the library
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, serverError, type IdRouteContext } from "@/lib/api";
import { READING_STATUS_VALUES } from "@/lib/manga";
import { parseId, readJsonBody } from "@/lib/validation";
import { getSessionId } from "@/lib/session";

export async function PATCH(req: Request, { params }: IdRouteContext) {
  const { id } = await params;
  const mangaId = parseId(id);
  if (!mangaId) {
    return badRequest("Invalid manga id");
  }

  const body = await readJsonBody(req);
  if (!body) {
    return badRequest("Invalid JSON body");
  }
  const { readingStatus, rating } = body;

  const data: { readingStatus?: string; rating?: number | null } = {};

  if (readingStatus !== undefined) {
    if (
      typeof readingStatus !== "string" ||
      !READING_STATUS_VALUES.includes(readingStatus)
    ) {
      return badRequest(
        `readingStatus must be one of: ${READING_STATUS_VALUES.join(", ")}`
      );
    }
    data.readingStatus = readingStatus;
  }

  if (rating !== undefined) {
    if (rating !== null && (typeof rating !== "number" || rating < 1 || rating > 10)) {
      return badRequest("rating must be a number between 1 and 10, or null");
    }
    data.rating = rating as number | null;
  }

  if (Object.keys(data).length === 0) {
    return badRequest("Nothing to update: provide readingStatus and/or rating");
  }

  try {
    const sessionId = await getSessionId(req);
    const existing = await prisma.manga.findFirst({
      where: { id: mangaId, sessionId },
    });

    if (!existing) {
      return notFound("Manga not found in current library");
    }

    const manga = await prisma.manga.update({
      where: { id: mangaId },
      data,
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    return serverError(err, "Failed to update manga");
  }
}

export async function DELETE(req: Request, { params }: IdRouteContext) {
  const { id } = await params;
  const mangaId = parseId(id);
  if (!mangaId) {
    return badRequest("Invalid manga id");
  }

  try {
    const sessionId = await getSessionId(req);
    const existing = await prisma.manga.findFirst({
      where: { id: mangaId, sessionId },
    });

    if (!existing) {
      return notFound("Manga not found in current library");
    }

    await prisma.manga.delete({ where: { id: mangaId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "Failed to delete manga");
  }
}

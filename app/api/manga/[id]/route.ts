// PATCH /api/manga/[id]   -> { readingStatus } updates reading status
// DELETE /api/manga/[id]  -> removes a manga from the library
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseId, readJsonBody } from "@/lib/validation";

const VALID_STATUSES = ["planning", "reading", "completed"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mangaId = parseId(id);

  if (!mangaId) {
    return NextResponse.json({ error: "Invalid manga id" }, { status: 400 });
  }

  const body = await readJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { readingStatus, rating } = body;

    const data: { readingStatus?: string; rating?: number | null } = {};

  if (readingStatus !== undefined) {
    if (typeof readingStatus !== "string" || !VALID_STATUSES.includes(readingStatus)) {
      return NextResponse.json(
        { error: `readingStatus must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
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
  const { id } = await params;
  const mangaId = parseId(id);

  if (!mangaId) {
    return NextResponse.json({ error: "Invalid manga id" }, { status: 400 });
  }

  try {
    await prisma.manga.delete({ where: { id: mangaId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to delete manga",
      notFound: "Manga not found",
    });
  }
}

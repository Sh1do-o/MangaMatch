// PATCH /api/manga/[id]   -> { readingStatus } updates reading status
// DELETE /api/manga/[id]  -> removes a manga from the library
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError, type IdRouteContext } from "@/lib/api";
import { READING_STATUS_VALUES } from "@/lib/manga";

export async function PATCH(req: Request, { params }: IdRouteContext) {
  const { id } = await params;
  const body = await req.json();
  const { readingStatus, rating } = body;

  const data: { readingStatus?: string; rating?: number | null } = {};

  if (readingStatus !== undefined) {
    if (!READING_STATUS_VALUES.includes(readingStatus)) {
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
    data.rating = rating;
  }

  try {
    const manga = await prisma.manga.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    return serverError(err, "Failed to update manga");
  }
}

export async function DELETE(req: Request, { params }: IdRouteContext) {
  const { id } = await params;

  try {
    await prisma.manga.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "Failed to delete manga");
  }
}

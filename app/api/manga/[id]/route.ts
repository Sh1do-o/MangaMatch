// PATCH /api/manga/[id]   -> { readingStatus } updates reading status
// DELETE /api/manga/[id]  -> removes a manga from the library
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["planning", "reading", "completed"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { readingStatus, rating } = body;

  const data: { readingStatus?: string; rating?: number | null } = {};

  if (readingStatus !== undefined) {
    if (!VALID_STATUSES.includes(readingStatus)) {
      return NextResponse.json(
        { error: `readingStatus must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    data.readingStatus = readingStatus;
  }

  if (rating !== undefined) {
    if (rating !== null && (typeof rating !== "number" || rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: "rating must be a number between 1 and 10, or null" },
        { status: 400 }
      );
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
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update manga" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.manga.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete manga" },
      { status: 500 }
    );
  }
}
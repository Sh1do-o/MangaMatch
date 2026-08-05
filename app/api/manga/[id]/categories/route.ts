// POST /api/manga/[id]/categories    -> { categoryId } add manga to category
// DELETE /api/manga/[id]/categories  -> { categoryId } remove manga from category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse, parseIdParam, parseJsonBody } from "@/lib/api";

async function readCategoryId(req: Request): Promise<number> {
  const body = await parseJsonBody(req);
  const { categoryId } = (body ?? {}) as { categoryId?: unknown };

  if (typeof categoryId !== "number" && typeof categoryId !== "string") {
    throw new HttpError(400, "'categoryId' is required");
  }
  return parseIdParam(String(categoryId), "categoryId");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mangaId = parseIdParam(id);
    const categoryId = await readCategoryId(req);

    const manga = await prisma.manga.update({
      where: { id: mangaId },
      data: { categories: { connect: { id: categoryId } } },
      include: { categories: true },
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to add category",
      notFound: "Manga or category not found",
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mangaId = parseIdParam(id);
    const categoryId = await readCategoryId(req);

    const manga = await prisma.manga.update({
      where: { id: mangaId },
      data: { categories: { disconnect: { id: categoryId } } },
      include: { categories: true },
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to remove category",
      notFound: "Manga or category not found",
    });
  }
}

// POST /api/manga/[id]/categories    -> { categoryId } add manga to category
// DELETE /api/manga/[id]/categories  -> { categoryId } remove manga from category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseId, readJsonBody } from "@/lib/validation";

async function parseIds(
  req: Request,
  idParam: string
): Promise<{ mangaId: number; categoryId: number } | null> {
  const mangaId = parseId(idParam);
  const body = await readJsonBody(req);
  const categoryId = body?.categoryId;
  return mangaId && Number.isInteger(categoryId) && (categoryId as number) > 0
    ? { mangaId, categoryId: categoryId as number }
    : null;
}

async function readCategoryId(req: Request): Promise<number> {
  const body = await parseJsonBody(req);
  const { categoryId } = (body ?? {}) as { categoryId?: unknown };

  if (typeof categoryId !== "number" && typeof categoryId !== "string") {
    throw new HttpError(400, "'categoryId' is required");
  }
  return parseIdParam(String(categoryId), "categoryId");
}

/** Connects or disconnects a category on a manga and returns the fresh row. */
async function updateCategoryLink(
  req: Request,
  params: IdRouteContext["params"],
  action: "connect" | "disconnect"
) {
  const { id } = await params;
  const ids = await parseIds(req, id);

  if (!ids) {
    return NextResponse.json(
      { error: "Invalid manga id or categoryId" },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const mangaId = parseIdParam(id);
    const categoryId = await readCategoryId(req);

    const manga = await prisma.manga.update({
      where: { id: ids.mangaId },
      data: { categories: { connect: { id: ids.categoryId } } },
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
  const { id } = await params;
  const ids = await parseIds(req, id);

  if (!ids) {
    return NextResponse.json(
      { error: "Invalid manga id or categoryId" },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const mangaId = parseIdParam(id);
    const categoryId = await readCategoryId(req);

    const manga = await prisma.manga.update({
      where: { id: ids.mangaId },
      data: { categories: { disconnect: { id: ids.categoryId } } },
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

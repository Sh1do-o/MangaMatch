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

export async function POST(
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
    const manga = await prisma.manga.update({
      where: { id: ids.mangaId },
      data: { categories: { connect: { id: ids.categoryId } } },
      include: { categories: true },
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add category" },
      { status: 500 }
    );
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
    const manga = await prisma.manga.update({
      where: { id: ids.mangaId },
      data: { categories: { disconnect: { id: ids.categoryId } } },
      include: { categories: true },
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to remove category" },
      { status: 500 }
    );
  }
}
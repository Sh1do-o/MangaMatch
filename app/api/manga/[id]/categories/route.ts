// POST /api/manga/[id]/categories    -> { categoryId } add manga to category
// DELETE /api/manga/[id]/categories  -> { categoryId } remove manga from category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { categoryId } = await req.json();

  try {
    const manga = await prisma.manga.update({
      where: { id: Number(id) },
      data: { categories: { connect: { id: Number(categoryId) } } },
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
  const { categoryId } = await req.json();

  try {
    const manga = await prisma.manga.update({
      where: { id: Number(id) },
      data: { categories: { disconnect: { id: Number(categoryId) } } },
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
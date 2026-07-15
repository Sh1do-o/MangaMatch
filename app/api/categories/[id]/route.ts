// DELETE /api/categories/[id]  -> delete a category (removes it from all manga automatically)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.category.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
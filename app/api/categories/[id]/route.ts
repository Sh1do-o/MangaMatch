// DELETE /api/categories/[id]  -> delete a category (removes it from all manga automatically)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseId } from "@/lib/validation";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categoryId = parseId(id);

  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to delete category",
      notFound: "Category not found",
    });
  }
}

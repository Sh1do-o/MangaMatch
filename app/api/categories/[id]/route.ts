// DELETE /api/categories/[id]  -> delete a category (removes it from all manga automatically)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, parseIdParam } from "@/lib/api";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id: parseIdParam(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to delete category",
      notFound: "Category not found",
    });
  }
}

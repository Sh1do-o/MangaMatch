// DELETE /api/categories/[id]  -> delete a category (removes it from all manga automatically)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError, type IdRouteContext } from "@/lib/api";
import { parseId } from "@/lib/validation";

export async function DELETE(req: Request, { params }: IdRouteContext) {
  const { id } = await params;
  const categoryId = parseId(id);
  if (!categoryId) {
    return badRequest("Invalid category id");
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "Failed to delete category");
  }
}

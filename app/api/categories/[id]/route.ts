// DELETE /api/categories/[id]  -> delete a category (removes it from all manga automatically)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serverError, type IdRouteContext } from "@/lib/api";

export async function DELETE(req: Request, { params }: IdRouteContext) {
  const { id } = await params;

  try {
    await prisma.category.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "Failed to delete category");
  }
}

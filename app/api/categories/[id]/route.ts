// DELETE /api/categories/[id]  -> delete a category (scoped to session)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, serverError, type IdRouteContext } from "@/lib/api";
import { parseId } from "@/lib/validation";
import { getSessionId } from "@/lib/session";

export async function DELETE(req: Request, { params }: IdRouteContext) {
  const { id } = await params;
  const categoryId = parseId(id);
  if (!categoryId) {
    return badRequest("Invalid category id");
  }

  try {
    const sessionId = await getSessionId(req);
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, sessionId },
    });

    if (!existing) {
      return notFound("Category not found in current session");
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "Failed to delete category");
  }
}

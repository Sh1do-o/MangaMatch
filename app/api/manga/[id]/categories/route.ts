// POST /api/manga/[id]/categories    -> { categoryId } add manga to category
// DELETE /api/manga/[id]/categories  -> { categoryId } remove manga from category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serverError, type IdRouteContext } from "@/lib/api";

/** Connects or disconnects a category on a manga and returns the fresh row. */
async function updateCategoryLink(
  req: Request,
  params: IdRouteContext["params"],
  action: "connect" | "disconnect"
) {
  const { id } = await params;
  const { categoryId } = await req.json();

  const link = { id: Number(categoryId) };

  try {
    const manga = await prisma.manga.update({
      where: { id: Number(id) },
      data: {
        categories:
          action === "connect" ? { connect: link } : { disconnect: link },
      },
      include: { categories: true },
    });
    return NextResponse.json({ success: true, manga });
  } catch (err) {
    const verb = action === "connect" ? "add" : "remove";
    return serverError(err, `Failed to ${verb} category`);
  }
}

export function POST(req: Request, { params }: IdRouteContext) {
  return updateCategoryLink(req, params, "connect");
}

export function DELETE(req: Request, { params }: IdRouteContext) {
  return updateCategoryLink(req, params, "disconnect");
}

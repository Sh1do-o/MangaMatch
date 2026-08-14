// POST /api/manga/[id]/categories    -> { categoryId } add manga to category
// DELETE /api/manga/[id]/categories  -> { categoryId } remove manga from category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, serverError, type IdRouteContext } from "@/lib/api";
import { parseId, readJsonBody } from "@/lib/validation";
import { getSessionId } from "@/lib/session";

/** Connects or disconnects a category on a manga and returns the fresh row. */
async function updateCategoryLink(
  req: Request,
  params: IdRouteContext["params"],
  action: "connect" | "disconnect"
) {
  const { id } = await params;
  const mangaId = parseId(id);
  if (!mangaId) {
    return badRequest("Invalid manga id");
  }

  const body = await readJsonBody(req);
  if (!body) {
    return badRequest("Invalid JSON body");
  }
  const categoryId = parseId(String(body.categoryId));
  if (!categoryId) {
    return badRequest("Invalid or missing 'categoryId'");
  }

  try {
    const sessionId = await getSessionId(req);

    // Verify manga belongs to current session
    const existingManga = await prisma.manga.findFirst({
      where: { id: mangaId, sessionId },
    });
    if (!existingManga) {
      return notFound("Manga not found in current library");
    }

    const link = { id: categoryId };

    const manga = await prisma.manga.update({
      where: { id: mangaId },
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

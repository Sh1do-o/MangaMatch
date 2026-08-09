// GET  /api/categories        -> list all categories
// POST /api/categories        -> create a new category { name, color? }
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, errorResponse, serverError } from "@/lib/api";
import {
  MAX_TITLE_LENGTH,
  parseHexColor,
  parseString,
  readJsonBody,
} from "@/lib/validation";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { manga: true } } },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return serverError(err, "Failed to load categories");
  }
}

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (!body) {
    return badRequest("Invalid JSON body");
  }

  const name = parseString(body.name, MAX_TITLE_LENGTH);
  if (!name) {
    return badRequest(
      `'name' must be a non-empty string of at most ${MAX_TITLE_LENGTH} characters`
    );
  }

  const color = body.color === undefined ? "#E8C77E" : parseHexColor(body.color);
  if (!color) {
    return badRequest("'color' must be a hex color like #E8C77E");
  }

  try {
    const category = await prisma.category.create({
      data: { name, color },
    });
    return NextResponse.json({ success: true, category });
  } catch (err) {
    // Unique constraint violation = category already exists
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return errorResponse("A category with that name already exists", 409);
    }
    return serverError(err, "Failed to create category");
  }
}

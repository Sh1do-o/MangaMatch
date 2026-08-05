// GET  /api/categories        -> list all categories
// POST /api/categories        -> create a new category { name, color? }
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseHexColor, parseString, readJsonBody } from "@/lib/validation";

const MAX_CATEGORY_NAME_LENGTH = 100;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { manga: true } } },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = parseString(body.name, MAX_CATEGORY_NAME_LENGTH);
  if (!name) {
    return NextResponse.json(
      { error: `'name' must be a non-empty string of at most ${MAX_CATEGORY_NAME_LENGTH} characters` },
      { status: 400 }
    );
  }

  const color = body.color === undefined ? "#E8C77E" : parseHexColor(body.color);
  if (!color) {
    return NextResponse.json(
      { error: "'color' must be a hex color like #E8C77E" },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({
      data: { name, color },
    });
    return NextResponse.json({ success: true, category });
  } catch (err) {
    // Unique constraint violation = category already exists
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A category with that name already exists" },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
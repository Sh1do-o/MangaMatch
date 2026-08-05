// GET  /api/categories        -> list all categories
// POST /api/categories        -> create a new category { name, color? }
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, errorResponse, serverError } from "@/lib/api";

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
  const body = await req.json();

  if (!body.name || typeof body.name !== "string") {
    return badRequest("Missing 'name'");
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        color: body.color ?? "#E8C77E",
      },
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

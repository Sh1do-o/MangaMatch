// GET  /api/categories        -> list all categories
// POST /api/categories        -> create a new category { name, color? }
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse, parseJsonBody } from "@/lib/api";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { manga: true } } },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return errorResponse(err, { fallback: "Failed to load categories" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req);
    const { name, color } = (body ?? {}) as {
      name?: unknown;
      color?: unknown;
    };

    if (typeof name !== "string" || name.trim().length === 0) {
      throw new HttpError(400, "'name' is required and must be a non-empty string");
    }
    if (color !== undefined && typeof color !== "string") {
      throw new HttpError(400, "'color' must be a string");
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color: color ?? "#E8C77E",
      },
    });
    return NextResponse.json({ success: true, category });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to create category",
      conflict: "A category with that name already exists",
    });
  }
}

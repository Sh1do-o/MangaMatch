// GET  /api/categories        -> list all categories
// POST /api/categories        -> create a new category { name, color? }
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  const body = await req.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        color: body.color ?? "#E8C77E",
      },
    });
    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    // Unique constraint violation = category already exists
    if (err.code === "P2002") {
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
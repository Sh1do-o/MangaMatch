// GET /api/manga/list
// Returns all manga saved in the library, most recently added first.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const manga = await prisma.manga.findMany({
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    });
    return NextResponse.json({ manga });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load library" },
      { status: 500 }
    );
  }
}
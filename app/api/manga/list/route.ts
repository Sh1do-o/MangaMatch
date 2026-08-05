// GET /api/manga/list
// Returns all manga saved in the library, most recently added first.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serverError } from "@/lib/api";

export async function GET() {
  try {
    const manga = await prisma.manga.findMany({
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    });
    return NextResponse.json({ manga });
  } catch (err) {
    return serverError(err, "Failed to load library");
  }
}

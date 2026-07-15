// GET /api/manga/trending?sort=trending|popular|top-rated&genre=Romance
// Returns manga from AniList sorted by trending/popularity/score, optionally filtered by genre.
import { NextRequest, NextResponse } from "next/server";
import { getBrowseManga, type BrowseSort } from "@/lib/anilist";

const VALID_SORTS: BrowseSort[] = ["trending", "popular", "top-rated"];

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort") ?? "trending";
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined;

  if (!VALID_SORTS.includes(sortParam as BrowseSort)) {
    return NextResponse.json(
      { error: `sort must be one of: ${VALID_SORTS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const results = await getBrowseManga(sortParam as BrowseSort, genre);
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch manga", details: message },
      { status: 500 }
    );
  }
}
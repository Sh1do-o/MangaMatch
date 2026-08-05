// GET /api/manga/trending?sort=trending|popular|top-rated&genre=Romance
// Returns manga from AniList sorted by trending/popularity/score, optionally filtered by genre.
import { NextRequest, NextResponse } from "next/server";
import { getBrowseManga, type BrowseSort } from "@/lib/anilist";

const VALID_SORTS: BrowseSort[] = ["trending", "popular", "top-rated"];

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort") ?? "trending";
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined;

  if (genre !== undefined && genre.length > 100) {
    return NextResponse.json(
      { error: "genre must be at most 100 characters" },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { error: "Failed to fetch manga" },
      { status: 500 }
    );
  }
}
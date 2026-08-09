// GET /api/manga/trending?sort=trending|popular|top-rated&genre=Romance
// Returns manga from AniList sorted by trending/popularity/score, optionally filtered by genre.
import { NextRequest, NextResponse } from "next/server";
import { getBrowseManga, type BrowseSort } from "@/lib/anilist";
import { badRequest, serverError } from "@/lib/api";

const VALID_SORTS: BrowseSort[] = ["trending", "popular", "top-rated"];

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort") ?? "trending";
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined;

  if (!VALID_SORTS.includes(sortParam as BrowseSort)) {
    return badRequest(`sort must be one of: ${VALID_SORTS.join(", ")}`);
  }

  try {
    const results = await getBrowseManga(sortParam as BrowseSort, genre);
    return NextResponse.json({ results });
  } catch (err) {
    return serverError(err, "Failed to fetch manga", true);
  }
}

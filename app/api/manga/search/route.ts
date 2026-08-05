// GET /api/manga/search?q=...
// Searches manga via the AniList API.
import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/anilist";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query || query.length > 200) {
    return NextResponse.json(
      { error: "Query parameter 'q' must be 1-200 characters" },
      { status: 400 }
    );
  }

  try {
    const results = await searchManga(query);
    return NextResponse.json({ query, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch manga" },
      { status: 500 }
    );
  }
}
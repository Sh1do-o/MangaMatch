// GET /api/manga/search?q=...
// Searches manga via the AniList API.
import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/anilist";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  try {
    const results = await searchManga(query);
    return NextResponse.json({ query, results });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch from Jikan API", details: message },
      { status: 500 }
    );
  }
}
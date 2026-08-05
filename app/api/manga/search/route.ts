// GET /api/manga/search?q=...
// Searches manga via the AniList API.
import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/anilist";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return badRequest("Missing query parameter 'q'");
  }

  try {
    const results = await searchManga(query);
    return NextResponse.json({ query, results });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to fetch from the AniList API",
    });
  }
}

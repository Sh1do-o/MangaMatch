// POST /api/recommend
// Builds a prompt from filters + a base manga and calls Gemini for recommendations.
import { NextRequest, NextResponse } from "next/server";
import { getRecommendations, type RecommendationFilters } from "@/lib/gemini";
import { searchManga } from "@/lib/anilist";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    genres = [],
    completionStatus = "any",
    chapterLength = "any",
    contentRating = "any",
    baseMangaIds = [],
    diverge = false,
    excludeTitles = [],
    customQuery = "",
  } = body;

  try {
    let baseManga: RecommendationFilters["baseManga"] = [];

    if (baseMangaIds.length > 0) {
      const mangaList = await prisma.manga.findMany({
        where: { id: { in: baseMangaIds.map(Number) } },
      });
      baseManga = mangaList.map((manga) => ({
        title: manga.title,
        genres: manga.genres.split(",").filter(Boolean),
        synopsis: manga.synopsis,
      }));
    }

    // Exclude everything already in the library, not just
    // titles dismissed/read within the current session.
    const libraryManga = await prisma.manga.findMany({
      select: { title: true },
    });
    const combinedExcludeTitles = Array.from(
      new Set([...excludeTitles, ...libraryManga.map((m) => m.title)])
    );

    const recommendations = await getRecommendations({
      genres,
      completionStatus,
      chapterLength,
      contentRating,
      baseManga,
      diverge,
      excludeTitles: combinedExcludeTitles,
      customQuery,
    });

    // Safety net: even with the exclusion instruction, Gemini can
    // occasionally still return a title already in the library.
    // Filter those out case-insensitively before returning.
    const libraryTitlesLower = new Set(
      libraryManga.map((m) => m.title.toLowerCase())
    );
    const filteredRecommendations = recommendations.filter(
      (rec) => !libraryTitlesLower.has(rec.title.toLowerCase())
    );

    // Enrich each recommendation with real cover/genre/chapter/status data
    // from AniList. Gemini sometimes returns a title with a translation
    // or alt-title in parentheses (e.g. "Foo (The Bar of Baz)"), which
    // rarely matches AniList's search exactly. Try the full title first,
    // then fall back to stripped variants if nothing was found.
    async function findBestMatch(title: string) {
      const candidates = [title];

      // "Title (Alt Title)" -> try "Title" alone
      const parenMatch = title.match(/^(.*?)\s*\((.*)\)\s*$/);
      if (parenMatch) {
        candidates.push(parenMatch[1].trim()); // outer part
        candidates.push(parenMatch[2].trim()); // inner/alt part
      }

      for (const candidate of candidates) {
        try {
          const results = await searchManga(candidate);
          if (results[0]) return results[0];
        } catch {
          // try the next candidate
        }
      }
      return null;
    }

    const enriched = await Promise.all(
      filteredRecommendations.map(async (rec) => {
        try {
          const match = await findBestMatch(rec.title);
          if (!match) return rec;

          return {
            ...rec,
            malId: match.malId,
            coverUrl: match.coverUrl,
            genres: match.genres,
            chapters: match.chapters,
            status: match.status,
            siteUrl: match.siteUrl,
          };
        } catch {
          // AniList failed for this title — keep the recommendation, no metadata
          return rec;
        }
      })
    );

    return NextResponse.json({ recommendations: enriched });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: message },
      { status: 500 }
    );
  }
}
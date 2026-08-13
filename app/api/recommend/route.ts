// POST /api/recommend
// Pulls a real candidate pool from AniList (broad, filtered only by
// completion status server-side), then asks Gemini to rank the best 5
// from that real list using genre/chapter-length/base-manga similarity
// as soft preferences — rather than either inventing titles from memory,
// or over-narrowing the pool with hard AniList-side filters that can
// silently zero it out (genre_in requires ALL listed genres at once,
// and chapter filters exclude anything with an unknown chapter count,
// which is common for ongoing series).
import { NextRequest, NextResponse } from "next/server";
import { rankCandidates, type CandidateManga } from "@/lib/gemini";
import {
  getCandidatePool,
  getMediaRecommendations,
  type MangaResult,
} from "@/lib/anilist";
import { prisma } from "@/lib/db";
import { serverError } from "@/lib/api";
import { parseList } from "@/lib/manga";
import { matchesChapterLength, matchesCompletionStatus } from "@/lib/filters";

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
    page = 1,
  } = body;

  try {
    let baseManga: { title: string; genres: string[]; synopsis: string | null }[] = [];
    let baseMangaAnilistIds: number[] = [];

    if (baseMangaIds.length > 0) {
      const mangaList = await prisma.manga.findMany({
        where: { id: { in: baseMangaIds.map(Number) } },
      });
      baseManga = mangaList.map((manga) => ({
        title: manga.title,
        genres: parseList(manga.genres),
        synopsis: manga.synopsis,
      }));
      baseMangaAnilistIds = mangaList.map((manga) => manga.anilistId);
    }

    // Exclude everything already in the library
    const libraryManga = await prisma.manga.findMany({
      select: { title: true },
    });
    const excludeTitlesLower = new Set(
      [...excludeTitles, ...libraryManga.map((m) => m.title)].map((t: string) =>
        t.toLowerCase()
      )
    );

    // Candidate pool — one query per selected genre/theme, so genre acts
    // as "any of these"; only completion status is a hard filter. `page`
    // lets "Suggest More"/"Diverge" reach past round 1's candidates
    // instead of re-ranking the same pool with fewer options each time.
    const rawPool = await getCandidatePool({
      genres,
      completionStatus,
      chapterLength,
      page,
    });

    let pool: MangaResult[] = [...rawPool];

    // Merge in AniList's own community "if you liked this, try that"
    // recommendations for each selected base manga — a stronger
    // similarity signal than genre-matching alone.
    if (baseMangaAnilistIds.length > 0) {
      const recLists = await Promise.all(
        baseMangaAnilistIds.map((id) => getMediaRecommendations(id))
      );
      const seen = new Set(pool.map((m) => m.anilistId));
      for (const list of recLists) {
        for (const m of list) {
          if (!seen.has(m.anilistId)) {
            seen.add(m.anilistId);
            pool.push(m);
          }
        }
      }
    }

    // Lenient client-side pass: only excludes candidates whose chapter
    // count or status is definitively known and out of range — never
    // punishes unknown/missing data.
    pool = pool.filter(
      (m) =>
        matchesCompletionStatus(m.status, completionStatus) &&
        matchesChapterLength(m.chapters, chapterLength)
    );

    // Filter out anything already in the library or already seen this session
    pool = pool.filter((m) => !excludeTitlesLower.has(m.title.toLowerCase()));

    // Best-effort content rating filter — AniList doesn't expose a granular
    // rating field, so this is a genre-based heuristic, not a hard guarantee
    if (contentRating === "safe") {
      pool = pool.filter(
        (m) => !m.genres.includes("Hentai") && !m.genres.includes("Ecchi")
      );
    }

    if (pool.length === 0) {
      return NextResponse.json({
        recommendations: [],
        note:
          page > 1
            ? "You've seen everything that matches these filters. Try loosening them or starting over."
            : "No manga matched these filters. Try loosening completion status or chapter length.",
      });
    }

    const candidatesForGemini: CandidateManga[] = pool.map((m) => ({
      anilistId: m.anilistId,
      title: m.title,
      genres: m.genres,
      synopsis: m.synopsis,
      chapters: m.chapters,
      status: m.status,
      score: m.score,
    }));

    const picks = await rankCandidates(candidatesForGemini, {
      genres,
      completionStatus,
      chapterLength,
      baseManga,
      diverge,
      customQuery,
    });

    const recommendations = picks.slice(0, 5).map((pick) => {
      const match = pool[pick.index];
      return {
        title: match.title,
        synopsis: match.synopsis ?? "",
        reason: pick.reason,
        anilistId: match.anilistId,
        coverUrl: match.coverUrl,
        genres: match.genres,
        chapters: match.chapters,
        status: match.status,
        siteUrl: match.siteUrl,
      };
    }); 

    return NextResponse.json({ recommendations });
  } catch (err) {
    return serverError(err, "Failed to generate recommendations", true);
  }
}
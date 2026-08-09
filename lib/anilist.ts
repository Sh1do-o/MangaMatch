// Helper functions for calling the AniList GraphQL API.
// Docs: https://docs.anilist.co/
// Official first-party API for AniList.co — no auth needed for public search.
import { anilistStatusList } from "@/lib/filters";
import { isGenre } from "@/lib/genres";

export interface MangaResult {
  malId: number; // AniList's own numeric ID (field name kept for compatibility)
  title: string;
  genres: string[];
  coverUrl: string | null;
  synopsis: string | null;
  status: string | null;
  authors: string[];
  publishedFrom: string | null;
  publishedTo: string | null;
  chapters: number | null;
  volumes: number | null;
  score: number | null; // normalized to a /10 scale, same as MAL
  siteUrl: string | null; // link to the full AniList page
}

interface AniListDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

/** The `Media` selection shared by every query below. */
interface AniListMedia {
  id: number;
  siteUrl: string | null;
  title: { romaji: string | null; english: string | null };
  genres: string[] | null;
  coverImage: { extraLarge: string | null; large: string | null } | null;
  description: string | null;
  status: string | null;
  chapters: number | null;
  volumes: number | null;
  averageScore: number | null;
  startDate: AniListDate | null;
  endDate: AniListDate | null;
  staff: {
    edges: { role: string; node: { name: { full: string } } }[];
  } | null;
}

// Every query selects exactly the fields `mapMediaToResult` reads, so the
// selection set is declared once and spliced into each query.
const MEDIA_FIELDS = `
  id
  siteUrl
  title { romaji english }
  genres
  coverImage { extraLarge large }
  description(asHtml: false)
  status
  chapters
  volumes
  averageScore
  startDate { year month day }
  endDate { year month day }
  staff(perPage: 5) {
    edges { role node { name { full } } }
  }
`;

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 10) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
      ${MEDIA_FIELDS}
    }
  }
}
`;

const BROWSE_QUERY = `
query ($sort: [MediaSort], $genre: String) {
  Page(perPage: 10) {
    media(type: MANGA, sort: $sort, genre: $genre, isAdult: false) {
      ${MEDIA_FIELDS}
    }
  }
}
`;

const MEDIA_RECOMMENDATIONS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    recommendations(sort: RATING_DESC, perPage: 10) {
      nodes {
        mediaRecommendation {
          ${MEDIA_FIELDS}
        }
      }
    }
  }
}
`;

function formatDate(d: AniListDate | null): string | null {
  if (!d || !d.year) return null;
  const month = String(d.month ?? 1).padStart(2, "0");
  const day = String(d.day ?? 1).padStart(2, "0");
  return `${d.year}-${month}-${day}`;
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").trim();
}

function mapMediaToResult(item: AniListMedia): MangaResult {
  const authors =
    item.staff?.edges
      ?.filter((e) => ["Story & Art", "Story", "Art"].includes(e.role))
      .map((e) => e.node.name.full) ?? [];

  return {
    malId: item.id,
    title: item.title.english ?? item.title.romaji ?? "",
    genres: item.genres ?? [],
    coverUrl: item.coverImage?.extraLarge ?? item.coverImage?.large ?? null,
    synopsis: stripHtml(item.description),
    status: item.status ?? null,
    authors,
    publishedFrom: formatDate(item.startDate),
    publishedTo: formatDate(item.endDate),
    chapters: item.chapters ?? null,
    volumes: item.volumes ?? null,
    score: item.averageScore ? item.averageScore / 10 : null,
    siteUrl: item.siteUrl ?? null,
  };
}

/**
 * Posts a query to AniList and returns its `data` payload, retrying
 * transient failures.
 */
async function postAniList<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.ok) {
      const json = await res.json();

      // GraphQL APIs often return HTTP 200 even when the query itself
      // is invalid — the real error lives in json.errors, not the
      // HTTP status. Without this check, an invalid query silently
      // returns an empty result instead of surfacing what broke.
      if (json.errors) {
        throw new Error(
          `AniList GraphQL error: ${JSON.stringify(json.errors)}`
        );
      }

      return json.data as T;
    }

    // Retry on rate limiting (429) or transient server errors
    const isTransient = [429, 500, 502, 503, 504].includes(res.status);
    const errBody = await res.text().catch(() => "");
    lastError = new Error(`AniList API error: ${res.status} — ${errBody}`);

    if (!isTransient || attempt === maxRetries) break;

    await new Promise((resolve) => setTimeout(resolve, attempt * 800));
  }

  throw lastError;
}

async function fetchAniList(
  query: string,
  variables: Record<string, unknown>
): Promise<AniListMedia[]> {
  const data = await postAniList<{ Page?: { media: AniListMedia[] } }>(
    query,
    variables
  );
  return data?.Page?.media ?? [];
}

export async function searchManga(query: string): Promise<MangaResult[]> {
  if (!query || query.trim().length === 0) return [];
  const media = await fetchAniList(SEARCH_QUERY, { search: query });
  return media.map(mapMediaToResult);
}

export type BrowseSort = "trending" | "popular" | "top-rated";

const SORT_MAP: Record<BrowseSort, string[]> = {
  trending: ["TRENDING_DESC"],
  popular: ["POPULARITY_DESC"],
  "top-rated": ["SCORE_DESC"],
};

export async function getBrowseManga(
  sort: BrowseSort,
  genre?: string
): Promise<MangaResult[]> {
  const media = await fetchAniList(BROWSE_QUERY, {
    sort: SORT_MAP[sort],
    genre: genre && genre !== "All" ? genre : null,
  });
  return media.map(mapMediaToResult);
}

/**
 * Fetches AniList's own community-submitted "if you liked this, try that"
 * recommendations for a given manga (by its AniList id). This is a much
 * stronger similarity signal than genre-matching alone, since it reflects
 * real reader opinions about what's actually similar.
 */
export async function getMediaRecommendations(
  malId: number
): Promise<MangaResult[]> {
  try {
    const data = await postAniList<{
      Media?: {
        recommendations: { nodes: { mediaRecommendation: AniListMedia | null }[] };
      };
    }>(MEDIA_RECOMMENDATIONS_QUERY, { id: malId });
    const nodes = data?.Media?.recommendations?.nodes ?? [];
    return nodes
      .map((n) => n.mediaRecommendation)
      .filter((m): m is AniListMedia => m != null)
      .map(mapMediaToResult);
  } catch {
    return [];
  }
}

export interface CandidatePoolFilters {
  genres: string[];
  completionStatus: string; // "any" | "ongoing" | "completed"
  chapterLength: string; // "any" | "short" | "medium" | "long"
}

const ARG_TYPES: Record<string, string> = {
  genre: "String",
  tag_in: "[String]",
  status_in: "[MediaStatus]",
  sort: "[MediaSort]",
  startDate_greater: "FuzzyDateInt",
};

const CANDIDATES_PER_QUERY = 30;
const MAX_SELECTIONS_QUERIED = 4; // keeps us well inside AniList's rate limit
const MAX_POOL_SIZE = 60; // caps the prompt size sent to the ranking step

function buildCandidateQuery(activeArgs: string[]): string {
  return `
query (${activeArgs.map((a) => `$${a}: ${ARG_TYPES[a]}`).join(", ")}) {
  Page(perPage: ${CANDIDATES_PER_QUERY}) {
    media(
      type: MANGA
      isAdult: false
      ${activeArgs.map((a) => `${a}: $${a}`).join("\n      ")}
    ) {
      ${MEDIA_FIELDS}
    }
  }
}
`;
}

/**
 * Builds a pool of real candidate manga matching the given filters,
 * pulled directly from AniList (not generated from an LLM's memory).
 *
 * Each selected genre/theme gets its own query, and the results are
 * interleaved. A single genre_in/tag_in query would only match media
 * carrying ALL the listed values at once, collapsing the pool to near
 * nothing for more than one selection — one query per selection gives
 * the "any of these" behaviour the UI implies, and interleaving keeps
 * every selection represented instead of letting the first one fill
 * the whole pool. Real AniList genres are queried with `genre`; AniList
 * *tags* (Isekai, Harem, Seinen, etc.) are queried with `tag_in`, since
 * `media(genre: "Isekai")` matches nothing — see isGenre() in
 * lib/genres.ts for which is which.
 *
 * Half the requests are recency-restricted (still popularity-sorted, so
 * they surface recent titles people actually read) so newer releases
 * are represented, since an LLM's own knowledge skews toward older,
 * more famous titles.
 *
 * Chapter length is intentionally NOT a server-side filter here:
 * chapters_lesser/greater exclude any manga with an unknown chapter
 * count (common for ongoing series), so applying it here can wipe out
 * an otherwise good, legitimate pool. It's applied leniently by the
 * caller instead. Completion status IS a hard filter, since it's
 * reliably populated.
 */
export async function getCandidatePool(
  filters: CandidatePoolFilters
): Promise<MangaResult[]> {
  const status = anilistStatusList(filters.completionStatus);

  const currentYear = new Date().getFullYear();
  const recentCutoff = (currentYear - 2) * 10000 + 101; // e.g. 20240101

  function buildRequest(selection: string | null, recentOnly: boolean) {
    const activeArgs = ["sort"];
    const vars: Record<string, unknown> = { sort: ["POPULARITY_DESC"] };

    if (selection) {
      if (isGenre(selection)) {
        activeArgs.push("genre");
        vars.genre = selection;
      } else {
        activeArgs.push("tag_in");
        vars.tag_in = [selection];
      }
    }
    if (status) {
      activeArgs.push("status_in");
      vars.status_in = status;
    }
    if (recentOnly) {
      activeArgs.push("startDate_greater");
      vars.startDate_greater = recentCutoff;
    }

    return { query: buildCandidateQuery(activeArgs), variables: vars };
  }

  const selections = filters.genres.slice(0, MAX_SELECTIONS_QUERIED);
  const requests =
    selections.length > 0
      ? [
          ...selections.map((s) => buildRequest(s, false)),
          ...selections.slice(0, 2).map((s) => buildRequest(s, true)),
        ]
      : [buildRequest(null, false), buildRequest(null, true)];

  const batches = await Promise.all(
    requests.map((req) =>
      fetchAniList(req.query, req.variables).catch((err) => {
        console.error("AniList candidate query failed:", err);
        return [];
      })
    )
  );

  const seen = new Set<number>();
  const merged: MangaResult[] = [];

  // Round-robin across batches so no single genre/theme dominates the pool.
  for (let i = 0; i < CANDIDATES_PER_QUERY; i++) {
    for (const batch of batches) {
      const item = batch[i];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(mapMediaToResult(item));
      if (merged.length >= MAX_POOL_SIZE) return merged;
    }
  }

  return merged;
}

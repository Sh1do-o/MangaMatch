// Helper functions for calling the AniList GraphQL API.
// Docs: https://docs.anilist.co/
// Official first-party API for AniList.co — no auth needed for public search.

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

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 10) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
      id
      siteUrl
      title {
        romaji
        english
      }
      genres
      coverImage {
        extraLarge
        large
      }
      description(asHtml: false)
      status
      chapters
      volumes
      averageScore
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      staff(perPage: 5) {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
    }
  }
}
`;

const BROWSE_QUERY = `
query ($sort: [MediaSort], $genre: String) {
  Page(perPage: 10) {
    media(type: MANGA, sort: $sort, genre: $genre, isAdult: false) {
      id
      siteUrl
      title {
        romaji
        english
      }
      genres
      coverImage {
        extraLarge
        large
      }
      description(asHtml: false)
      status
      chapters
      volumes
      averageScore
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      staff(perPage: 5) {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
    }
  }
}
`;

function formatDate(d: { year: number | null; month: number | null; day: number | null } | null): string | null {
  if (!d || !d.year) return null;
  const month = String(d.month ?? 1).padStart(2, "0");
  const day = String(d.day ?? 1).padStart(2, "0");
  return `${d.year}-${month}-${day}`;
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").trim();
}

function mapMediaToResult(item: any): MangaResult {
  const authors =
    item.staff?.edges
      ?.filter((e: any) => ["Story & Art", "Story", "Art"].includes(e.role))
      .map((e: any) => e.node.name.full) ?? [];

  return {
    malId: item.id,
    title: item.title.english ?? item.title.romaji,
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

async function fetchAniList(
  query: string,
  variables: Record<string, unknown>
): Promise<any[]> {
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

      return json.data?.Page?.media ?? [];
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

const MEDIA_RECOMMENDATIONS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    recommendations(sort: RATING_DESC, perPage: 10) {
      nodes {
        mediaRecommendation {
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
        }
      }
    }
  }
}
`;

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
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: MEDIA_RECOMMENDATIONS_QUERY,
        variables: { id: malId },
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    if (json.errors) return [];

    const nodes = json.data?.Media?.recommendations?.nodes ?? [];
    return nodes
      .map((n: any) => n.mediaRecommendation)
      .filter(Boolean)
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

function buildCandidateQuery(activeArgs: string[]): string {
  return `
query (${activeArgs.map((a) => `$${a}: ${ARG_TYPES[a]}`).join(", ")}) {
  Page(perPage: 30) {
    media(
      type: MANGA
      isAdult: false
      ${activeArgs.map((a) => `${a}: $${a}`).join("\n      ")}
    ) {
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
    }
  }
}
`;
}

const ARG_TYPES: Record<string, string> = {
  genre_in: "[String]",
  status_in: "[MediaStatus]",
  chapters_greater: "Int",
  chapters_lesser: "Int",
  sort: "[MediaSort]",
  startDate_greater: "FuzzyDateInt",
};

function chapterRange(chapterLength: string): { greater?: number; lesser?: number } {
  switch (chapterLength) {
    case "short":
      return { lesser: 100 };
    case "medium":
      return { greater: 99, lesser: 401 };
    case "long":
      return { greater: 400 };
    default:
      return {};
  }
}

function statusList(completionStatus: string): string[] | undefined {
  if (completionStatus === "ongoing") return ["RELEASING", "HIATUS"];
  if (completionStatus === "completed") return ["FINISHED"];
  return undefined;
}

/**
 * Builds a pool of real candidate manga matching the given filters,
 * pulled directly from AniList (not generated from an LLM's memory).
 * Merges a general popularity-sorted batch with a recency-biased batch
 * so newer releases are guaranteed to be represented, since an LLM's
 * own knowledge tends to skew toward older, more famous titles.
 *
 * Genre and chapter-length are intentionally NOT applied as hard
 * server-side filters here:
 * - genre_in requires ALL listed genres simultaneously, not any one —
 *   with several genres selected this narrows the real pool to near
 *   nothing. Genre is instead passed to the ranking step as a soft
 *   preference.
 * - chapters_lesser/greater exclude any manga with an unknown chapter
 *   count (common for ongoing series), so applying it server-side can
 *   wipe out an otherwise good, legitimate pool.
 * Only completion status is applied as a hard filter here, since that
 * field is reliably populated.
 */
export async function getCandidatePool(
  filters: CandidatePoolFilters
): Promise<MangaResult[]> {
  const status = statusList(filters.completionStatus);

  const currentYear = new Date().getFullYear();
  const recentCutoff = (currentYear - 2) * 10000; // e.g. 2023 -> 20230000

  function buildRequest(sort: string[], includeRecency: boolean) {
    const activeArgs = ["sort"];
    const vars: Record<string, unknown> = { sort };

    if (status) {
      activeArgs.push("status_in");
      vars.status_in = status;
    }
    if (includeRecency) {
      activeArgs.push("startDate_greater");
      vars.startDate_greater = recentCutoff;
    }

    return { query: buildCandidateQuery(activeArgs), variables: vars };
  }

  const popularReq = buildRequest(["POPULARITY_DESC"], false);
  const recentReq = buildRequest(["START_DATE_DESC"], true);

  const [popular, recent] = await Promise.all([
    fetchAniList(popularReq.query, popularReq.variables).catch((err) => {
      console.error("AniList popular candidate query failed:", err);
      return [];
    }),
    fetchAniList(recentReq.query, recentReq.variables).catch((err) => {
      console.error("AniList recent candidate query failed:", err);
      return [];
    }),
  ]);

  const seen = new Set<number>();
  const merged = [...recent, ...popular].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return merged.map(mapMediaToResult);
}
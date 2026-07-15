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
      return json.data?.Page?.media ?? [];
    }

    // Retry on rate limiting (429) or transient server errors
    const isTransient = [429, 500, 502, 503, 504].includes(res.status);
    lastError = new Error(`AniList API error: ${res.status}`);

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
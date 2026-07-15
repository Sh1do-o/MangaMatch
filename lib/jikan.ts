// Helper functions for calling the Jikan (MyAnimeList) API.
// Docs: https://docs.api.jikan.moe/

export interface MangaResult {
  malId: number;
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
  score: number | null;
}

export async function searchManga(query: string): Promise<MangaResult[]> {
  if (!query || query.trim().length === 0) return [];

  const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(
    query
  )}&limit=10`;

  // Jikan is a free, community-run API and occasionally returns
  // transient errors (504 timeouts, 429 rate limits). Retry a few
  // times with a short delay before giving up.
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);

    if (res.ok) {
      const json = await res.json();
      return json.data.map((item: any) => ({
        malId: item.mal_id,
        title: item.title,
        genres: item.genres?.map((g: any) => g.name) ?? [],
        coverUrl: item.images?.jpg?.image_url ?? null,
        synopsis: item.synopsis ?? null,
        status: item.status ?? null,
        authors: item.authors?.map((a: any) => a.name) ?? [],
        publishedFrom: item.published?.from ?? null,
        publishedTo: item.published?.to ?? null,
        chapters: item.chapters ?? null,
        volumes: item.volumes ?? null,
        score: item.score ?? null,
      }));
    }

    // Only retry on transient errors (429 rate limit, 502/503/504 server issues)
    const isTransient = [429, 502, 503, 504].includes(res.status);
    lastError = new Error(`Jikan API error: ${res.status}`);

    if (!isTransient || attempt === maxRetries) break;

    // Wait a bit longer each retry (500ms, 1000ms, ...)
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }

  throw lastError;
}
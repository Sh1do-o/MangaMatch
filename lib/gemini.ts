// Helper functions for calling the Gemini API to generate manga recommendations.

export interface RecommendationFilters {
  genres: string[];
  completionStatus: string; // "any" | "ongoing" | "completed"
  chapterLength: string; // "any" | "short" | "medium" | "long"
  contentRating: string; // "any" | "safe" | "mature"
  baseManga: {
    title: string;
    genres: string[];
    synopsis: string | null;
  }[];
  diverge: boolean; // if true, nudge results away from strict similarity
  excludeTitles: string[]; // titles already suggested or marked "already read"
  customQuery: string; // free-text extra instructions from the user
}

export interface Recommendation {
  title: string;
  synopsis: string;
  reason: string;
  malId?: number | null;
  coverUrl?: string | null;
  genres?: string[];
  chapters?: number | null;
  status?: string | null;
  siteUrl?: string | null;
}

function buildPrompt(filters: RecommendationFilters): string {
  const parts: string[] = [];

  parts.push(
    "You are a manga recommendation engine. Recommend 5 manga based on the following criteria."
  );

  if (filters.genres.length > 0) {
    parts.push(`Genres: ${filters.genres.join(", ")}`);
  }
  if (filters.completionStatus !== "any") {
    parts.push(`Completion status: ${filters.completionStatus}`);
  }
  if (filters.chapterLength !== "any") {
    parts.push(`Chapter length preference: ${filters.chapterLength}`);
  }
  if (filters.contentRating !== "any") {
    parts.push(`Content rating: ${filters.contentRating}`);
  }

  if (filters.baseManga.length > 0) {
    const baseDescriptions = filters.baseManga
      .map(
        (m) =>
          `"${m.title}" (genres: ${m.genres.join(", ")}; synopsis: ${
            m.synopsis ?? "N/A"
          })`
      )
      .join("; ");

    parts.push(
      filters.baseManga.length === 1
        ? `Base the recommendations primarily on similarity to this manga: ${baseDescriptions}.`
        : `Base the recommendations on similarity to ALL of these manga collectively, finding common threads between them rather than matching just one: ${baseDescriptions}.`
    );
  }

  parts.push(
    "Favor manga that generally have mostly positive reader reviews and reception, rather than just matching genres alone."
  );

  if (filters.diverge) {
    parts.push(
      "Diverge somewhat from the exact filters and base manga above — suggest titles that are more loosely related, offering variety rather than close matches."
    );
  }

  if (filters.customQuery && filters.customQuery.trim().length > 0) {
    parts.push(`Additional user instructions: ${filters.customQuery.trim()}`);
  }

  if (filters.excludeTitles.length > 0) {
    parts.push(
      `Do NOT recommend these titles, they have already been suggested or read: ${filters.excludeTitles.join(", ")}.`
    );
  }

  parts.push(
    "Respond ONLY with a JSON array, no other text, no markdown code fences. " +
      'Each item must have this exact shape: { "title": string, "synopsis": string, "reason": string }. ' +
      '"reason" should briefly explain why this manga was recommended given the criteria above. ' +
      '"title" must be just the primary title as it would appear on AniList or MyAnimeList — do NOT include an alternate title or translation in parentheses.'
  );

  return parts.join("\n");
}

export async function getRecommendations(
  filters: RecommendationFilters
): Promise<Recommendation[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const prompt = buildPrompt(filters);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned no content");
  }

  // Strip markdown code fences if Gemini added them despite instructions
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse Gemini response as JSON");
  }
}
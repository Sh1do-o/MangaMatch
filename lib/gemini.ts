// Helper functions for calling the Gemini API to rank real manga
// candidates (pulled from AniList) rather than inventing titles from
// memory. This guarantees every recommendation is a real, currently
// existing manga with accurate chapter counts/status, since that data
// comes directly from AniList rather than the LLM's own (possibly
// stale or wrong) recollection.

export interface CandidateManga {
  anilistId: number;
  title: string;
  genres: string[];
  synopsis: string | null;
  chapters: number | null;
  status: string | null;
  score: number | null;
}

export interface RankingFilters {
  genres: string[];
  completionStatus: string;
  chapterLength: string;
  baseManga: {
    title: string;
    genres: string[];
    synopsis: string | null;
  }[];
  diverge: boolean; // if true, nudge results away from strict similarity
  customQuery: string; // free-text extra instructions from the user
}

export interface RankedPick {
  index: number;
  reason: string;
}

export function buildPrompt(
  candidates: CandidateManga[],
  filters: RankingFilters
): string {
  const parts: string[] = [];

  parts.push(
    "You are a master manga recommendation and matchmaking engine. Below is a numbered list of REAL manga candidates."
  );

  if (filters.genres.length > 0) {
    parts.push(
      `TARGET GENRES & THEMES (TOP PRIORITY): The user explicitly requested: [${filters.genres.join(", ")}]. ` +
      `You MUST prioritize candidates that directly match or blend these requested genres/themes. ` +
      `For example, if "Isekai", "Romance", and "Fantasy" are requested, candidates with an Isekai premise and romantic subplots MUST be ranked at the top. ` +
      `Do NOT recommend off-genre or generic titles just because they have high ratings when closer matching candidates exist.`
    );
  }
  if (filters.completionStatus !== "any") {
    parts.push(`Preferred completion status: ${filters.completionStatus}.`);
  }
  if (filters.chapterLength !== "any") {
    parts.push(
      `Preferred chapter length: ${filters.chapterLength}. Use the chapters count shown per candidate where available.`
    );
  }

  if (filters.baseManga.length > 0) {
    const baseDescriptions = filters.baseManga
      .map(
        (m) =>
          `"${m.title}" (genres/themes: ${m.genres.join(", ")}; synopsis: ${
            m.synopsis ?? "N/A"
          })`
      )
      .join("; ");

    parts.push(
      filters.baseManga.length === 1
        ? `Anchor strongly on this favorite manga: ${baseDescriptions}. Find titles sharing its core appeal, premise, tone, or dynamics.`
        : `Anchor collectively on these favorite manga: ${baseDescriptions}. Find titles reflecting their shared strengths.`
    );
  }

  if (filters.diverge) {
    parts.push(
      "Diverge mode is ON: prefer creative or underappreciated hidden gems that still honor the requested themes."
    );
  } else {
    parts.push(
      "Within candidates that match the requested themes/anchors, favor higher quality titles (higher score)."
    );
  }

  if (filters.customQuery && filters.customQuery.trim().length > 0) {
    parts.push(`Additional user instructions: ${filters.customQuery.trim()}`);
  }

  parts.push("\nCandidates:");
  candidates.forEach((c, i) => {
    parts.push(
      `${i}. "${c.title}" | Genres/Themes: ${c.genres.join(", ")} | Status: ${
        c.status ?? "unknown"
      } | Score: ${c.score ?? "N/A"}/10 | Synopsis: ${(c.synopsis ?? "").slice(0, 160)}`
    );
  });

  parts.push(
    "\nRespond ONLY with a JSON array, no other text, no markdown code fences. " +
      'Each item must have this exact shape: { "index": number, "reason": string }, where "index" is the candidate\'s number from the list above. ' +
      '"reason" should briefly explain why this pick fits, referencing the requested genres/themes. ' +
      "Return exactly 5 items, ranked best-first, using only indices from the list."
  );

  return parts.join("\n");
}

export async function rankCandidates(
  candidates: CandidateManga[],
  filters: RankingFilters
): Promise<RankedPick[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const prompt = buildPrompt(candidates, filters);

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

  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse Gemini response as JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response was not a JSON array of picks");
  }

  // Guard against malformed, out-of-range, and repeated indices
  const validPicks: RankedPick[] = [];
  const seenIndices = new Set<number>();

  for (const item of parsed) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof item.index === "number" &&
      typeof item.reason === "string" &&
      item.index >= 0 &&
      item.index < candidates.length &&
      !seenIndices.has(item.index)
    ) {
      validPicks.push({ index: item.index, reason: item.reason });
      seenIndices.add(item.index);
    }
  }

  return validPicks;
}
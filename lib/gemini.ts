// Helper functions for calling the Gemini API to rank real manga
// candidates (pulled from AniList) rather than inventing titles from
// memory. This guarantees every recommendation is a real, currently
// existing manga with accurate chapter counts/status, since that data
// comes directly from AniList rather than the LLM's own (possibly
// stale or wrong) recollection.

export interface CandidateManga {
  malId: number;
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

function buildPrompt(
  candidates: CandidateManga[],
  filters: RankingFilters
): string {
  const parts: string[] = [];

  parts.push(
    "You are a manga recommendation engine. Below is a numbered list of REAL manga candidates. Your job is to pick the best 5 from THIS LIST ONLY, ranked best-first, based on quality and fit — do not invent or suggest anything not in this list."
  );

  if (filters.genres.length > 0) {
    parts.push(
      `Preferred genres/themes: ${filters.genres.join(", ")}. Every candidate below already matches at least one of these (some are AniList themes rather than genres, so they won't always appear in a candidate's listed genres). Favor candidates matching several of them, but don't treat that as a strict requirement — a great pick matching fewer is better than a mediocre pick matching all of them.`
    );
  }
  if (filters.completionStatus !== "any") {
    parts.push(`Preferred completion status: ${filters.completionStatus}.`);
  }
  if (filters.chapterLength !== "any") {
    parts.push(
      `Preferred chapter length: ${filters.chapterLength}. Use the chapters count shown per candidate where available; if unknown, use your judgment.`
    );
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
        ? `Prioritize similarity to this manga: ${baseDescriptions}.`
        : `Prioritize similarity to ALL of these manga collectively, finding common threads rather than matching just one: ${baseDescriptions}.`
    );
  }

  parts.push(
    "All else equal, favor candidates with a higher score (indicating positive reception)."
  );

  if (filters.diverge) {
    parts.push(
      "Diverge somewhat from the closest matches — prefer picks that are more loosely related to the base manga/criteria, for variety rather than the most obvious picks."
    );
  }

  if (filters.customQuery && filters.customQuery.trim().length > 0) {
    parts.push(`Additional user instructions: ${filters.customQuery.trim()}`);
  }

  parts.push("\nCandidates:");
  candidates.forEach((c, i) => {
    parts.push(
      `${i}. "${c.title}" — genres: ${c.genres.join(", ")}; status: ${
        c.status ?? "unknown"
      }; chapters: ${c.chapters ?? "unknown"}; score: ${
        c.score ?? "unknown"
      }/10; synopsis: ${(c.synopsis ?? "").slice(0, 200)}`
    );
  });

  parts.push(
    "\nRespond ONLY with a JSON array, no other text, no markdown code fences. " +
      'Each item must have this exact shape: { "index": number, "reason": string }, where "index" is the candidate\'s number from the list above. ' +
      '"reason" should briefly explain why this pick fits, referencing the base manga/criteria. ' +
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

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
  } catch (err) {
    throw new Error(
      `Could not reach the Gemini API: ${
        err instanceof Error ? err.message : String(err)
      }`,
      { cause: err }
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json().catch((err: unknown) => {
    throw new Error("Gemini returned a non-JSON response", { cause: err });
  });
  const text: string | undefined =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned no content");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Keep the raw response on the error: without it there's no way to tell
    // whether the model wrapped its answer in prose, refused, or truncated.
    throw new Error(
      `Failed to parse Gemini response as JSON: ${cleaned.slice(0, 300)}`,
      { cause: err }
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Gemini response was not a JSON array: ${cleaned.slice(0, 300)}`
    );
  }

  // Guard against out-of-range or malformed indices
  const picks = parsed.filter(
    (p): p is RankedPick =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as RankedPick).index === "number" &&
      (p as RankedPick).index >= 0 &&
      (p as RankedPick).index < candidates.length
  );

  if (picks.length === 0) {
    throw new Error(
      `Gemini returned no valid candidate indices (got ${parsed.length} item(s) for a pool of ${candidates.length})`
    );
  }

  return picks;
}
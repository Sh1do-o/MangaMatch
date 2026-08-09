import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rankCandidates,
  type CandidateManga,
  type RankingFilters,
} from "@/lib/gemini";

function candidate(overrides: Partial<CandidateManga> = {}): CandidateManga {
  return {
    malId: 1,
    title: "Vinland Saga",
    genres: ["Action", "Adventure"],
    synopsis: "Vikings.",
    chapters: 200,
    status: "RELEASING",
    score: 8.9,
    ...overrides,
  };
}

function filters(overrides: Partial<RankingFilters> = {}): RankingFilters {
  return {
    genres: [],
    completionStatus: "any",
    chapterLength: "any",
    baseManga: [],
    diverge: false,
    customQuery: "",
    ...overrides,
  };
}

function geminiResponse(text: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
    text: async () => text,
  } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

function sentPrompt(): string {
  const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
  return body.contents[0].parts[0].text;
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  fetchMock = vi.fn(async () =>
    geminiResponse('[{"index": 0, "reason": "Fits"}]')
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("rankCandidates", () => {
  it("throws when the API key is missing, without calling the API", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    await expect(rankCandidates([candidate()], filters())).rejects.toThrow(
      /GEMINI_API_KEY is not set/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the API key in the request URL", async () => {
    await rankCandidates([candidate()], filters());

    expect(String(fetchMock.mock.calls[0][0])).toContain("key=test-key");
  });

  it("parses the ranked picks from the response", async () => {
    const picks = await rankCandidates(
      [candidate(), candidate({ malId: 2 })],
      filters()
    );

    expect(picks).toEqual([{ index: 0, reason: "Fits" }]);
  });

  it("strips markdown code fences before parsing", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiResponse('```json\n[{"index": 1, "reason": "Fenced"}]\n```')
    );

    const picks = await rankCandidates(
      [candidate(), candidate({ malId: 2 })],
      filters()
    );

    expect(picks).toEqual([{ index: 1, reason: "Fenced" }]);
  });

  it("drops picks with malformed or out-of-range indices", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiResponse(
        JSON.stringify([
          { index: 0, reason: "ok" },
          { index: 5, reason: "out of range" },
          { index: -1, reason: "negative" },
          { index: "1", reason: "not a number" },
          { reason: "missing index" },
        ])
      )
    );

    const picks = await rankCandidates(
      [candidate(), candidate({ malId: 2 })],
      filters()
    );

    expect(picks).toEqual([{ index: 0, reason: "ok" }]);
  });

  it("throws on a non-OK HTTP response", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse("quota exceeded", 429));

    await expect(rankCandidates([candidate()], filters())).rejects.toThrow(
      /Gemini API error: 429 quota exceeded/
    );
  });

  it("throws when the response contains no content", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] }),
      text: async () => "",
    } as Response);

    await expect(rankCandidates([candidate()], filters())).rejects.toThrow(
      /Gemini returned no content/
    );
  });

  it("throws when the response is not valid JSON", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse("Sure! Here you go."));

    await expect(rankCandidates([candidate()], filters())).rejects.toThrow(
      /Failed to parse Gemini response as JSON/
    );
  });
});

describe("rankCandidates prompt building", () => {
  it("numbers candidates from zero and truncates long synopses", async () => {
    const longSynopsis = "a".repeat(300);
    await rankCandidates(
      [
        candidate({ title: "First" }),
        candidate({ malId: 2, title: "Second", synopsis: longSynopsis }),
      ],
      filters()
    );

    const prompt = sentPrompt();
    expect(prompt).toContain('0. "First"');
    expect(prompt).toContain('1. "Second"');
    expect(prompt).toContain("a".repeat(200));
    expect(prompt).not.toContain("a".repeat(201));
  });

  it("labels unknown candidate fields rather than omitting them", async () => {
    await rankCandidates(
      [candidate({ status: null, chapters: null, score: null, synopsis: null })],
      filters()
    );

    const prompt = sentPrompt();
    expect(prompt).toContain("status: unknown");
    expect(prompt).toContain("chapters: unknown");
    expect(prompt).toContain("score: unknown/10");
  });

  it("omits preference lines when filters are unset", async () => {
    await rankCandidates([candidate()], filters());

    const prompt = sentPrompt();
    expect(prompt).not.toContain("Preferred genres");
    expect(prompt).not.toContain("Preferred completion status");
    expect(prompt).not.toContain("Preferred chapter length");
    expect(prompt).not.toContain("Prioritize similarity");
    expect(prompt).not.toContain("Diverge somewhat");
    expect(prompt).not.toContain("Additional user instructions");
  });

  it("includes genre, status and chapter-length preferences when set", async () => {
    await rankCandidates(
      [candidate()],
      filters({
        genres: ["Action", "Drama"],
        completionStatus: "completed",
        chapterLength: "long",
      })
    );

    const prompt = sentPrompt();
    expect(prompt).toContain("Preferred genres: Action, Drama");
    expect(prompt).toContain("Preferred completion status: completed");
    expect(prompt).toContain("Preferred chapter length: long");
  });

  it("uses singular phrasing for one base manga", async () => {
    await rankCandidates(
      [candidate()],
      filters({
        baseManga: [
          { title: "Berserk", genres: ["Action"], synopsis: "Dark fantasy" },
        ],
      })
    );

    const prompt = sentPrompt();
    expect(prompt).toContain("Prioritize similarity to this manga:");
    expect(prompt).toContain('"Berserk" (genres: Action; synopsis: Dark fantasy)');
  });

  it("uses collective phrasing for multiple base manga and handles null synopses", async () => {
    await rankCandidates(
      [candidate()],
      filters({
        baseManga: [
          { title: "Berserk", genres: ["Action"], synopsis: null },
          { title: "Vagabond", genres: ["Drama"], synopsis: "Swords" },
        ],
      })
    );

    const prompt = sentPrompt();
    expect(prompt).toContain("Prioritize similarity to ALL of these manga");
    expect(prompt).toContain("synopsis: N/A");
    expect(prompt).toContain('"Vagabond"');
  });

  it("adds the diverge nudge and trimmed custom instructions", async () => {
    await rankCandidates(
      [candidate()],
      filters({ diverge: true, customQuery: "  no isekai please  " })
    );

    const prompt = sentPrompt();
    expect(prompt).toContain("Diverge somewhat");
    expect(prompt).toContain("Additional user instructions: no isekai please");
  });

  it("ignores a whitespace-only custom query", async () => {
    await rankCandidates([candidate()], filters({ customQuery: "   " }));

    expect(sentPrompt()).not.toContain("Additional user instructions");
  });
});

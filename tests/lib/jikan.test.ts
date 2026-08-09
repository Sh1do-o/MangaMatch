import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchManga } from "@/lib/jikan";

function jikanItem(overrides: Record<string, unknown> = {}) {
  return {
    mal_id: 2,
    title: "Berserk",
    genres: [{ name: "Action" }, { name: "Drama" }],
    images: { jpg: { image_url: "https://img/berserk.jpg" } },
    synopsis: "Guts.",
    status: "Publishing",
    authors: [{ name: "Miura, Kentarou" }],
    published: { from: "1989-08-25T00:00:00+00:00", to: null },
    chapters: 374,
    volumes: 41,
    score: 9.47,
    ...overrides,
  };
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => response({ data: [jikanItem()] }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("jikan searchManga", () => {
  it("returns an empty list without calling the API for blank queries", async () => {
    expect(await searchManga("")).toEqual([]);
    expect(await searchManga("  ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("url-encodes the query and maps the response", async () => {
    const results = await searchManga("attack on titan");

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.jikan.moe/v4/manga?q=attack%20on%20titan&limit=10"
    );
    expect(results).toEqual([
      {
        malId: 2,
        title: "Berserk",
        genres: ["Action", "Drama"],
        coverUrl: "https://img/berserk.jpg",
        synopsis: "Guts.",
        status: "Publishing",
        authors: ["Miura, Kentarou"],
        publishedFrom: "1989-08-25T00:00:00+00:00",
        publishedTo: null,
        chapters: 374,
        volumes: 41,
        score: 9.47,
      },
    ]);
  });

  it("normalizes missing optional fields to null or empty arrays", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        data: [
          {
            mal_id: 3,
            title: "Sparse",
          },
        ],
      })
    );

    const [result] = await searchManga("sparse");

    expect(result).toEqual({
      malId: 3,
      title: "Sparse",
      genres: [],
      coverUrl: null,
      synopsis: null,
      status: null,
      authors: [],
      publishedFrom: null,
      publishedTo: null,
      chapters: null,
      volumes: null,
      score: null,
    });
  });

  it("does not retry non-transient errors", async () => {
    fetchMock.mockResolvedValue(response({}, 404));

    await expect(searchManga("x")).rejects.toThrow("Jikan API error: 404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors and returns the eventual success", async () => {
    fetchMock
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({ data: [jikanItem({ mal_id: 9 })] }));

    const results = await searchManga("x");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results[0].malId).toBe(9);
  });

  it("gives up after the retry limit on persistent transient errors", async () => {
    fetchMock.mockResolvedValue(response({}, 504));

    await expect(searchManga("x")).rejects.toThrow("Jikan API error: 504");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

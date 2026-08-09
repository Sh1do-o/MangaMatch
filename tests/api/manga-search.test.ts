import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const searchManga = vi.fn();
vi.mock("@/lib/anilist", () => ({ searchManga: (q: string) => searchManga(q) }));

const { GET } = await import("@/app/api/manga/search/route");

function request(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  searchManga.mockReset();
});

describe("GET /api/manga/search", () => {
  it("400s when 'q' is missing", async () => {
    const res = await GET(request("/api/manga/search"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Missing query parameter 'q'",
    });
    expect(searchManga).not.toHaveBeenCalled();
  });

  it("returns the query alongside the search results", async () => {
    searchManga.mockResolvedValue([{ malId: 1, title: "Berserk" }]);

    const res = await GET(request("/api/manga/search?q=berserk"));

    expect(searchManga).toHaveBeenCalledWith("berserk");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      query: "berserk",
      results: [{ malId: 1, title: "Berserk" }],
    });
  });

  it("500s with the failure details when the search throws", async () => {
    searchManga.mockRejectedValue(new Error("AniList API error: 503"));

    const res = await GET(request("/api/manga/search?q=x"));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({
      details: "AniList API error: 503",
    });
  });

  it("reports a generic message for non-Error rejections", async () => {
    searchManga.mockRejectedValue("weird");

    const res = await GET(request("/api/manga/search?q=x"));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ details: "Unknown error" });
  });
});

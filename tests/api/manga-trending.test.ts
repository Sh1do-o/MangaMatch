import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getBrowseManga = vi.fn();
vi.mock("@/lib/anilist", () => ({
  getBrowseManga: (sort: string, genre?: string) => getBrowseManga(sort, genre),
}));

const { GET } = await import("@/app/api/manga/trending/route");

function request(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}

beforeEach(() => {
  getBrowseManga.mockResolvedValue([{ malId: 1, title: "Berserk" }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  getBrowseManga.mockReset();
});

describe("GET /api/manga/trending", () => {
  it("defaults to the trending sort with no genre", async () => {
    const res = await GET(request("/api/manga/trending"));

    expect(getBrowseManga).toHaveBeenCalledWith("trending", undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: [{ malId: 1, title: "Berserk" }] });
  });

  it.each(["trending", "popular", "top-rated"])(
    "accepts the %s sort and forwards the genre",
    async (sort) => {
      const res = await GET(
        request(`/api/manga/trending?sort=${sort}&genre=Romance`)
      );

      expect(getBrowseManga).toHaveBeenCalledWith(sort, "Romance");
      expect(res.status).toBe(200);
    }
  );

  it("400s on an unknown sort without hitting AniList", async () => {
    const res = await GET(request("/api/manga/trending?sort=bogus"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "sort must be one of: trending, popular, top-rated",
    });
    expect(getBrowseManga).not.toHaveBeenCalled();
  });

  it("500s with details when the upstream fetch fails", async () => {
    getBrowseManga.mockRejectedValue(new Error("boom"));

    const res = await GET(request("/api/manga/trending"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Failed to fetch manga",
      details: "boom",
    });
  });

  it("reports a generic message for non-Error rejections", async () => {
    getBrowseManga.mockRejectedValue({ nope: true });

    const res = await GET(request("/api/manga/trending"));

    expect(await res.json()).toMatchObject({ details: "Unknown error" });
  });
});

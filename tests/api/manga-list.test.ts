import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { manga: { findMany: (a: unknown) => findMany(a) } },
}));

const { GET } = await import("@/app/api/manga/list/route");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  findMany.mockReset();
});

describe("GET /api/manga/list", () => {
  it("returns the library newest-first with categories included", async () => {
    findMany.mockResolvedValue([{ id: 2, title: "Newer", categories: [] }]);

    const res = await GET();

    expect(findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      manga: [{ id: 2, title: "Newer", categories: [] }],
    });
  });

  it("500s when the query fails", async () => {
    findMany.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to load library" });
  });
});

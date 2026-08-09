import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();
const destroy = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    manga: {
      update: (a: unknown) => update(a),
      delete: (a: unknown) => destroy(a),
    },
  },
}));

const { PATCH, DELETE } = await import("@/app/api/manga/[id]/route");

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/manga/7", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const params = { params: Promise.resolve({ id: "7" }) };

beforeEach(() => {
  update.mockResolvedValue({ id: 7 });
  destroy.mockResolvedValue({ id: 7 });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  update.mockReset();
  destroy.mockReset();
});

describe("PATCH /api/manga/[id]", () => {
  it.each(["planning", "reading", "completed"])(
    "updates the reading status to %s",
    async (readingStatus) => {
      const res = await PATCH(patchRequest({ readingStatus }), params);

      expect(update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { readingStatus },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, manga: { id: 7 } });
    }
  );

  it("400s on an invalid reading status", async () => {
    const res = await PATCH(patchRequest({ readingStatus: "dropped" }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "readingStatus must be one of: planning, reading, completed",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it.each([1, 10])("accepts the boundary rating %i", async (rating) => {
    await PATCH(patchRequest({ rating }), params);

    expect(update).toHaveBeenCalledWith({ where: { id: 7 }, data: { rating } });
  });

  it("accepts a null rating to clear it", async () => {
    await PATCH(patchRequest({ rating: null }), params);

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { rating: null },
    });
  });

  it.each([0, 11, "8"])("400s on the invalid rating %j", async (rating) => {
    const res = await PATCH(patchRequest({ rating }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "rating must be a number between 1 and 10, or null",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates both fields at once and ignores unknown keys", async () => {
    await PATCH(
      patchRequest({ readingStatus: "reading", rating: 8, title: "hax" }),
      params
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { readingStatus: "reading", rating: 8 },
    });
  });

  it("400s when no known fields are provided", async () => {
    const res = await PATCH(patchRequest({}), params);

    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("500s when the update fails", async () => {
    update.mockRejectedValue(new Error("no such row"));

    const res = await PATCH(patchRequest({ rating: 5 }), params);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to update manga" });
  });
});

describe("DELETE /api/manga/[id]", () => {
  it("deletes by numeric id", async () => {
    const res = await DELETE(
      new Request("http://localhost/api/manga/7", { method: "DELETE" }),
      params
    );

    expect(destroy).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(await res.json()).toEqual({ success: true });
  });

  it("500s when the delete fails", async () => {
    destroy.mockRejectedValue(new Error("nope"));

    const res = await DELETE(
      new Request("http://localhost/api/manga/7", { method: "DELETE" }),
      params
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to delete manga" });
  });
});

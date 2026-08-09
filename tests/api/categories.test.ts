import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findMany = vi.fn();
const create = vi.fn();
const destroy = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: (a: unknown) => findMany(a),
      create: (a: unknown) => create(a),
      delete: (a: unknown) => destroy(a),
    },
  },
}));

const { GET, POST } = await import("@/app/api/categories/route");
const { DELETE } = await import("@/app/api/categories/[id]/route");

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/categories", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  findMany.mockResolvedValue([{ id: 1, name: "Favorites", _count: { manga: 2 } }]);
  create.mockResolvedValue({ id: 1, name: "Favorites" });
  destroy.mockResolvedValue({ id: 1 });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  findMany.mockReset();
  create.mockReset();
  destroy.mockReset();
});

describe("GET /api/categories", () => {
  it("lists categories alphabetically with manga counts", async () => {
    const res = await GET();

    expect(findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: { _count: { select: { manga: true } } },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      categories: [{ id: 1, name: "Favorites", _count: { manga: 2 } }],
    });
  });

  it("500s when the query fails", async () => {
    findMany.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to load categories" });
  });
});

describe("POST /api/categories", () => {
  it.each([{}, { name: "" }, { name: 42 }])(
    "400s on the invalid body %j",
    async (body) => {
      const res = await POST(postRequest(body));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Missing 'name'" });
      expect(create).not.toHaveBeenCalled();
    }
  );

  it("trims the name and applies the default color", async () => {
    const res = await POST(postRequest({ name: "  Favorites  " }));

    expect(create).toHaveBeenCalledWith({
      data: { name: "Favorites", color: "#E8C77E" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      category: { id: 1, name: "Favorites" },
    });
  });

  it("honors an explicit color", async () => {
    await POST(postRequest({ name: "Favorites", color: "#ff0000" }));

    expect(create).toHaveBeenCalledWith({
      data: { name: "Favorites", color: "#ff0000" },
    });
  });

  it("409s on a duplicate name (Prisma P2002)", async () => {
    create.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));

    const res = await POST(postRequest({ name: "Favorites" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "A category with that name already exists",
    });
  });

  it("500s on any other database error", async () => {
    create.mockRejectedValue(new Error("db down"));

    const res = await POST(postRequest({ name: "Favorites" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create category" });
  });
});

describe("DELETE /api/categories/[id]", () => {
  const params = { params: Promise.resolve({ id: "1" }) };

  function deleteRequest() {
    return new Request("http://localhost/api/categories/1", { method: "DELETE" });
  }

  it("deletes by numeric id", async () => {
    const res = await DELETE(deleteRequest(), params);

    expect(destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("500s when the delete fails", async () => {
    destroy.mockRejectedValue(new Error("nope"));

    const res = await DELETE(deleteRequest(), params);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to delete category" });
  });
});

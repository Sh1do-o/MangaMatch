import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { manga: { update: (a: unknown) => update(a) } },
}));

const { POST, DELETE } = await import(
  "@/app/api/manga/[id]/categories/route"
);

function request(method: string, body: unknown) {
  return new Request("http://localhost/api/manga/7/categories", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const params = { params: Promise.resolve({ id: "7" }) };

beforeEach(() => {
  update.mockResolvedValue({ id: 7, categories: [{ id: 3 }] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  update.mockReset();
});

describe("POST /api/manga/[id]/categories", () => {
  it("connects the category, coercing string ids to numbers", async () => {
    const res = await POST(request("POST", { categoryId: "3" }), params);

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { categories: { connect: { id: 3 } } },
      include: { categories: true },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      manga: { id: 7, categories: [{ id: 3 }] },
    });
  });

  it("500s when the connect fails", async () => {
    update.mockRejectedValue(new Error("nope"));

    const res = await POST(request("POST", { categoryId: 3 }), params);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to add category" });
  });
});

describe("DELETE /api/manga/[id]/categories", () => {
  it("disconnects the category", async () => {
    const res = await DELETE(request("DELETE", { categoryId: 3 }), params);

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { categories: { disconnect: { id: 3 } } },
      include: { categories: true },
    });
    expect(res.status).toBe(200);
  });

  it("500s when the disconnect fails", async () => {
    update.mockRejectedValue(new Error("nope"));

    const res = await DELETE(request("DELETE", { categoryId: 3 }), params);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to remove category" });
  });
});

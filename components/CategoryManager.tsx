"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function CategoryManager({
  mangaId,
  assigned,
}: {
  mangaId: number;
  assigned: Category[];
}) {
  const router = useRouter();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setAllCategories(data.categories ?? []));
  }, []);

  const assignedIds = new Set(assigned.map((c) => c.id));

  async function toggleCategory(category: Category) {
    setBusyId(category.id);
    const isAssigned = assignedIds.has(category.id);

    try {
      await fetch(`/api/manga/${mangaId}/categories`, {
        method: isAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category.id }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAllCategories((prev) => [...prev, data.category]);
        setNewName("");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
        Categories
      </p>

      {/* Category pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {allCategories.map((cat) => {
          const isAssigned = assignedIds.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat)}
              disabled={busyId === cat.id}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
                isAssigned
                  ? "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220]"
                  : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
        {allCategories.length === 0 && (
          <p className="text-xs text-[#8CA0BE]">
            No categories yet — create one below.
          </p>
        )}
      </div>

      {/* Add category form */}
      <form onSubmit={createCategory} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 rounded-full border border-[#1E2C42] bg-[#0F1B2E] px-4 py-2 text-xs text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none transition-all duration-300 focus:border-[#E8C77E]/50 focus:shadow-[0_0_15px_rgba(232,199,126,0.1)]"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-full border border-[#E8C77E]/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#E8C77E] transition-all duration-200 hover:bg-[#E8C77E] hover:text-[#0B1220] hover:shadow-[0_0_15px_rgba(232,199,126,0.3)] disabled:opacity-50"
        >
          + Add
        </button>
      </form>
    </div>
  );
}
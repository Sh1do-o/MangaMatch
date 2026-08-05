"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TogglePill from "@/components/TogglePill";
import {
  createCategory,
  fetchCategories,
  setMangaCategory,
} from "@/lib/api-client";
import type { Category } from "@/lib/types";
import { LABEL } from "@/lib/ui";

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
    fetchCategories().then(setAllCategories).catch(() => setAllCategories([]));
  }, []);

  const assignedIds = new Set(assigned.map((c) => c.id));

  async function toggleCategory(category: Category) {
    setBusyId(category.id);

    try {
      await setMangaCategory(mangaId, category.id, assignedIds.has(category.id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const category = await createCategory(newName.trim());
      setAllCategories((prev) => [...prev, category]);
      setNewName("");
    } catch {
      // surfaced by the empty input staying filled — nothing else to do
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <p className={`mb-2 ${LABEL}`}>Categories</p>

      {/* Category pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {allCategories.map((cat) => (
          <TogglePill
            key={cat.id}
            active={assignedIds.has(cat.id)}
            onClick={() => toggleCategory(cat)}
            disabled={busyId === cat.id}
            className="px-3 py-1 text-[10px]"
          >
            {cat.name}
          </TogglePill>
        ))}
        {allCategories.length === 0 && (
          <p className="text-xs text-[#8CA0BE]">
            No categories yet — create one below.
          </p>
        )}
      </div>

      {/* Add category form */}
      <form onSubmit={handleCreateCategory} className="flex gap-2">
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

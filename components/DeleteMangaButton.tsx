"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteManga } from "@/lib/api-client";
import { cn, BUTTON_DANGER } from "@/lib/ui";

export default function DeleteMangaButton({ mangaId }: { mangaId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteManga(mangaId);
      router.push("/library");
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#8CA0BE]">Remove this manga?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            BUTTON_DANGER,
            "px-4 py-2 hover:shadow-[0_0_15px_rgba(232,160,160,0.3)]"
          )}
        >
          {deleting ? "Removing..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-full border border-[#1E2C42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE] transition-all duration-200 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-full border border-[#1E2C42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE] transition-all duration-200 hover:border-[#E8A0A0]/60 hover:text-[#E8A0A0] hover:bg-[#E8A0A0]/10"
    >
      Remove from Library
    </button>
  );
}

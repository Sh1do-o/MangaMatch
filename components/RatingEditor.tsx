"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingEditor({
  mangaId,
  currentRating,
}: {
  mangaId: number;
  currentRating: number | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(currentRating);
  const [busy, setBusy] = useState(false);

  async function updateRating(value: number) {
    const newValue = value === rating ? null : value;
    setBusy(true);
    setRating(newValue);

    try {
      const res = await fetch(`/api/manga/${mangaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newValue }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setRating(currentRating);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
        Your Rating {rating !== null && (
          <span className="text-[#E8C77E]">— {rating}/10</span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isFilled = rating !== null && n <= rating;
          return (
            <button
              key={n}
              onClick={() => updateRating(n)}
              disabled={busy}
              className={`flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs transition-all duration-200 disabled:opacity-50 ${
                isFilled
                  ? "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220] shadow-[0_0_8px_rgba(232,199,126,0.3)]"
                  : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#E8C77E]/50 hover:text-[#E8C77E]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
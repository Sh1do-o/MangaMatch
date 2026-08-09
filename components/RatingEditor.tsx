"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateManga } from "@/lib/api-client";
import { cn, pillClass, LABEL } from "@/lib/ui";

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
      await updateManga(mangaId, { rating: newValue });
      router.refresh();
    } catch {
      setRating(currentRating);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className={`mb-2 ${LABEL}`}>
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
              className={cn(
                pillClass(isFilled, "gold"),
                "flex h-9 w-9 items-center justify-center text-xs",
                isFilled && "shadow-[0_0_8px_rgba(232,199,126,0.3)]"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  { value: "planning", label: "Planning" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
];

export default function ReadingStatusEditor({
  mangaId,
  currentStatus,
}: {
  mangaId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);

  async function updateStatus(value: string) {
    if (value === status) return;
    setBusy(true);
    setStatus(value); // optimistic

    try {
      const res = await fetch(`/api/manga/${mangaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingStatus: value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus(currentStatus); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
        Reading Status
      </p>
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            disabled={busy}
            className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
              status === s.value
                ? "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220] shadow-[0_0_10px_rgba(245,245,240,0.15)]"
                : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
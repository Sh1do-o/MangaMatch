"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, requestJson } from "@/lib/http";

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
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(value: string) {
    if (value === status) return;
    setBusy(true);
    setStatus(value); // optimistic
    setError(null);

    try {
      await requestJson(`/api/manga/${mangaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingStatus: value }),
      });
      router.refresh();
    } catch (err) {
      setStatus(currentStatus); // revert on failure
      setError(`Couldn't update reading status: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className={`mb-2 ${LABEL}`}>Reading Status</p>
      <div className="flex flex-wrap gap-1.5">
        {READING_STATUSES.map((s) => (
          <TogglePill
            key={s.value}
            active={status === s.value}
            onClick={() => updateStatus(s.value)}
            disabled={busy}
            className="px-4 py-2 text-xs"
          >
            {s.label}
          </TogglePill>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-[#E8A0A0]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

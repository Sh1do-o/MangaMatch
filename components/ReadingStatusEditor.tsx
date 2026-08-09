"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TogglePill from "@/components/TogglePill";
import { updateManga } from "@/lib/api-client";
import { READING_STATUSES } from "@/lib/manga";
import { LABEL } from "@/lib/ui";

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
      await updateManga(mangaId, { readingStatus: value });
      router.refresh();
    } catch {
      setStatus(currentStatus); // revert on failure
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
    </div>
  );
}

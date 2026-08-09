"use client";

import { useEffect, useState } from "react";

// Rotates through while a recommendation request is in flight, so a
// multi-second wait (candidate pool fetch + Gemini ranking) reads as
// progress instead of a frozen screen.
const STATUS_LABELS = [
  "Browsing through the index",
  "Cross-referencing your taste",
  "Weighing up the candidates",
  "This might take a while",
];

const ROTATE_MS = 2200;

export default function RecommendingModal() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLabelIndex((i) => (i + 1) % STATUS_LABELS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-8 text-center shadow-2xl">
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[#F5F5F0]">
          Recommending Manga
          <span className="inline-flex w-6 justify-start">
            <span className="animate-bounce [animation-delay:-0.3s]">.</span>
            <span className="animate-bounce [animation-delay:-0.15s]">.</span>
            <span className="animate-bounce">.</span>
          </span>
        </h3>
        <p
          key={labelIndex}
          className="animate-fade-in-up font-mono text-[11px] uppercase tracking-wide text-[#8CA0BE]"
        >
          {STATUS_LABELS[labelIndex]}
        </p>
      </div>
    </div>
  );
}

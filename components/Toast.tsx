"use client";

import { useEffect } from "react";
import { cn } from "@/lib/ui";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  type = "success",
  onClose,
  durationMs = 3500,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  const icons = {
    success: (
      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-[#E8C77E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borders = {
    success: "border-emerald-500/30 bg-[#0F1B2E]/95 shadow-[0_10px_30px_rgba(16,185,129,0.15)]",
    error: "border-rose-500/30 bg-[#0F1B2E]/95 shadow-[0_10px_30px_rgba(244,63,94,0.15)]",
    info: "border-[#E8C77E]/30 bg-[#0F1B2E]/95 shadow-[0_10px_30px_rgba(232,199,126,0.15)]",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3.5 backdrop-blur-xl transition-all",
          borders[type]
        )}
      >
        <span className="shrink-0">{icons[type]}</span>
        <p className="text-xs font-medium text-[#F5F5F0]">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 rounded-full p-1 text-[#8CA0BE] hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

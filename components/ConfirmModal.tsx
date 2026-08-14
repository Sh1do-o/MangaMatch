"use client";

import { useEffect } from "react";
import { BUTTON_DANGER, BUTTON_SECONDARY } from "@/lib/ui";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-md transition-all">
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-[#1E2C42] bg-[#0F1B2E]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          {isDestructive ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8C77E]/30 bg-[#E8C77E]/10 text-[#E8C77E]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#F5F5F0]">
            {title}
          </h3>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-[#8CA0BE]">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className={`${BUTTON_SECONDARY} px-4 py-2 text-xs`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              isDestructive
                ? `${BUTTON_DANGER} px-4 py-2 text-xs font-semibold`
                : "rounded-full border border-[#E8C77E] bg-[#E8C77E] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all hover:bg-[#F5F5F0]"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

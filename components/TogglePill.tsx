"use client";

import { cn, pillClass, type Accent } from "@/lib/ui";

/** Rounded pill button whose selected state is filled with the accent colour. */
export default function TogglePill({
  active,
  onClick,
  children,
  accent = "light",
  disabled,
  className = "px-3.5 py-1.5 text-xs",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: Accent;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(pillClass(active, accent), className)}
    >
      {children}
    </button>
  );
}

// Shared Tailwind class recipes for the recurring visual elements of the UI
// (toggle pills, buttons, small mono labels, glassmorphic cards, and badges).

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Accent colour of an element's selected state. */
export type Accent = "light" | "gold";

const ACCENT_ACTIVE: Record<Accent, string> = {
  light: "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220] shadow-[0_0_20px_rgba(245,245,240,0.25)]",
  gold: "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220] shadow-[0_0_20px_rgba(232,199,126,0.35)]",
};

const ACCENT_IDLE: Record<Accent, string> = {
  light:
    "border-[#1E2C42] bg-[#0F1B2E]/60 text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:bg-[#1E2C42]/40 hover:text-[#F5F5F0]",
  gold:
    "border-[#1E2C42] bg-[#0F1B2E]/60 text-[#8CA0BE] hover:border-[#E8C77E]/40 hover:bg-[#E8C77E]/5 hover:text-[#E8C77E]",
};

export function pillClass(active: boolean, accent: Accent = "light"): string {
  return cn(
    "rounded-full border font-mono uppercase tracking-wide transition-all duration-200 disabled:opacity-50 active:scale-95",
    active ? ACCENT_ACTIVE[accent] : ACCENT_IDLE[accent]
  );
}

/** Non-interactive tag/chip, e.g. a genre or category label. */
export function chipClass(accent: Accent = "gold"): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider backdrop-blur-sm transition-colors",
    accent === "gold"
      ? "border-[#E8C77E]/25 bg-[#E8C77E]/10 text-[#E8C77E]"
      : "border-[#F5F5F0]/20 bg-[#F5F5F0]/10 text-[#F5F5F0]"
  );
}

export const BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#E8C77E] bg-[#E8C77E] text-xs font-semibold uppercase tracking-wide text-[#0B1220] shadow-[0_4px_20px_rgba(232,199,126,0.25)] transition-all duration-300 hover:bg-[#F5F5F0] hover:border-[#F5F5F0] hover:shadow-[0_0_30px_rgba(245,245,240,0.4)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

export const BUTTON_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#1E2C42] bg-[#0F1B2E]/80 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide text-[#8CA0BE] transition-all duration-300 hover:border-[#E8C77E]/50 hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0] active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

export const BUTTON_DANGER =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 font-mono text-[10px] uppercase tracking-wide text-red-400 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

export const BUTTON_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-mono uppercase tracking-wide text-[#8CA0BE] transition-all duration-200 hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0] active:scale-95";

/** Glass card container style */
export const CARD_SURFACE =
  "rounded-2xl border border-[#1E2C42]/80 bg-[#0F1B2E]/70 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-[#E8C77E]/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]";

/** Small mono caption above a control or metadata value. */
export const LABEL =
  "font-mono text-[10px] uppercase tracking-wider text-[#8CA0BE]";

/** Status badge styles with color coding */
export function statusBadge(status: string | null | undefined): {
  label: string;
  className: string;
} {
  const normalized = (status ?? "unknown").toLowerCase();
  switch (normalized) {
    case "reading":
      return {
        label: "Reading",
        className: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      };
    case "completed":
    case "finished":
      return {
        label: "Completed",
        className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      };
    case "planning":
      return {
        label: "Planning",
        className: "border-amber-400/30 bg-amber-500/10 text-amber-300",
      };
    case "releasing":
      return {
        label: "Releasing",
        className: "border-purple-400/30 bg-purple-500/10 text-purple-300",
      };
    case "hiatus":
      return {
        label: "Hiatus",
        className: "border-orange-400/30 bg-orange-500/10 text-orange-300",
      };
    default:
      return {
        label: status ?? "Unknown",
        className: "border-[#1E2C42] bg-[#1E2C42]/40 text-[#8CA0BE]",
      };
  }
}

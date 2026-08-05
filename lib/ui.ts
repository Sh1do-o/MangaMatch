// Shared Tailwind class recipes for the recurring visual elements of the UI
// (toggle pills, buttons, small mono labels). Padding is intentionally left
// to the caller so the same recipe can be used at different sizes.

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Accent colour of an element's selected state. */
export type Accent = "light" | "gold";

const ACCENT_ACTIVE: Record<Accent, string> = {
  light: "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220]",
  gold: "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220]",
};

const ACCENT_IDLE: Record<Accent, string> = {
  light:
    "border-[#1E2C42] text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]",
  gold: "border-[#1E2C42] text-[#8CA0BE] hover:border-[#E8C77E]/40 hover:text-[#E8C77E]",
};

export function pillClass(active: boolean, accent: Accent = "light"): string {
  return cn(
    "rounded-full border font-mono uppercase tracking-wide transition-all duration-200 disabled:opacity-50",
    active ? ACCENT_ACTIVE[accent] : ACCENT_IDLE[accent]
  );
}

/** Non-interactive tag/chip, e.g. a genre or category label. */
export function chipClass(accent: Accent = "gold"): string {
  return cn(
    "rounded-full border font-mono uppercase tracking-wide backdrop-blur-sm",
    accent === "gold"
      ? "border-[#E8C77E]/20 bg-[#E8C77E]/5 text-[#E8C77E]"
      : "border-[#F5F5F0]/20 bg-[#F5F5F0]/5 text-[#F5F5F0]"
  );
}

export const BUTTON_PRIMARY =
  "rounded-full border border-[#F5F5F0] bg-[#F5F5F0] text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.35)] active:scale-95 disabled:opacity-50";

export const BUTTON_SECONDARY =
  "rounded-full border border-[#1E2C42] text-xs font-semibold uppercase tracking-wide text-[#8CA0BE] transition-all duration-300 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0] disabled:opacity-50";

export const BUTTON_DANGER =
  "rounded-full border border-[#E8A0A0]/50 font-mono text-[10px] uppercase tracking-wide text-[#E8A0A0] transition-all duration-200 hover:bg-[#E8A0A0] hover:text-[#0B1220] disabled:opacity-50";

/** Small mono caption above a control or metadata value. */
export const LABEL =
  "font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]";

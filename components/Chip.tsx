import { chipClass, cn, type Accent } from "@/lib/ui";

/** Non-interactive tag, e.g. a genre or category label on a card. */
export default function Chip({
  children,
  accent = "gold",
  className = "px-2.5 py-0.5 text-[10px]",
}: {
  children: React.ReactNode;
  accent?: Accent;
  className?: string;
}) {
  return <span className={cn(chipClass(accent), className)}>{children}</span>;
}

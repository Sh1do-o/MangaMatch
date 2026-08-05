import { cn } from "@/lib/ui";

/** "N results" caption introducing a grid, with decorative rules. */
export default function ResultsHeader({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("animate-fade-in-up mb-6 flex items-center gap-3", className)}
      style={style}
    >
      <span className="h-px w-8 bg-gradient-to-r from-[#E8C77E]/40 to-transparent" />
      <span className="font-mono text-xs uppercase tracking-wide text-[#E8C77E]">
        {children}
      </span>
      <span className="h-px flex-1 bg-[#1E2C42]" />
    </div>
  );
}

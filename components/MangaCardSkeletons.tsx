import { cn } from "@/lib/ui";

// Bar heights/widths per skeleton line, mirroring a title + metadata rows.
const LINES = ["h-5 w-3/4", "h-4 w-1/2", "h-4 w-full"];

/** Placeholder cards shown while a grid of manga is loading. */
export default function MangaCardSkeletons({
  count = 3,
  lines = 2,
  className,
}: {
  count?: number;
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E]"
        >
          <div className="aspect-[2/3] w-full bg-[#1E2C42]" />
          <div className="space-y-3 p-4">
            {LINES.slice(0, lines).map((line) => (
              <div key={line} className={`rounded bg-[#1E2C42] ${line}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

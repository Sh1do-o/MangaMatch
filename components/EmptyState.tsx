import { cn } from "@/lib/ui";

/** Dashed placeholder panel used wherever a list has nothing to show. */
export default function EmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[#1E2C42] px-6 py-16 text-center",
        className
      )}
    >
      {children}
    </div>
  );
}

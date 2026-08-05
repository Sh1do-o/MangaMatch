import { cn } from "@/lib/ui";

export default function ErrorBanner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#4A2A2A] bg-[#1A0F0F] px-4 py-3 text-sm text-[#E8A0A0]",
        className
      )}
    >
      {children}
    </div>
  );
}

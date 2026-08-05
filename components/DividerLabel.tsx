// A small caption centred between two fading gold rules.
export default function DividerLabel({
  children,
  className = "font-mono text-xs uppercase tracking-[0.2em] text-[#E8C77E]",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
      <span className={className}>{children}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
    </div>
  );
}

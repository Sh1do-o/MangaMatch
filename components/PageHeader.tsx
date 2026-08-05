import DividerLabel from "@/components/DividerLabel";

// Shared page masthead: an eyebrow between gold rules, a gradient title and
// an optional supporting line.
export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in-up mb-12 border-b border-[#1E2C42] pb-10">
      <DividerLabel>{eyebrow}</DividerLabel>
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight lg:text-5xl">
        <span className="text-gradient-gold">{title}</span>
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8CA0BE]">
          {description}
        </p>
      )}
    </div>
  );
}

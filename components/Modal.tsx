// Centred dialog card over a blurred backdrop.
export default function Modal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-6 shadow-2xl">
        <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#F5F5F0]">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

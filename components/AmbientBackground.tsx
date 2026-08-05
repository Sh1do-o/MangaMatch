// The drifting glow blobs behind every page. Position/size/blur differ per
// page and are passed in as classes.
export default function AmbientBackground({
  primary,
  secondary,
  secondaryDelay = "-6s",
}: {
  primary: string;
  secondary: string;
  secondaryDelay?: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div
        className={`animate-drift absolute rounded-full bg-[#E8C77E]/5 ${primary}`}
      />
      <div
        className={`animate-drift absolute rounded-full bg-[#1E2C42]/30 ${secondary}`}
        style={{ animationDelay: secondaryDelay }}
      />
    </div>
  );
}

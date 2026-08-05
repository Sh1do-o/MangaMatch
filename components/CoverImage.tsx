/**
 * Cover art filling its container, with a text fallback when a manga has no
 * cover. Plain <img> rather than next/image: covers come from AniList's CDN
 * at arbitrary sizes and don't need optimizing.
 */
export default function CoverImage({
  src,
  alt,
  imgClassName,
  fallback = (
    <div className="flex h-full items-center justify-center text-xs text-[#8CA0BE]">
      No cover
    </div>
  ),
}: {
  src: string | null;
  alt: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
}) {
  if (!src) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${imgClassName ?? ""}`}
    />
  );
}

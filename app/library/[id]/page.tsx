import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryManager from "@/components/CategoryManager";
import ReadingStatusEditor from "@/components/ReadingStatusEditor";
import DeleteMangaButton from "@/components/DeleteMangaButton";
import RatingEditor from "@/components/RatingEditor";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manga = await prisma.manga.findUnique({
    where: { id: Number(id) },
    include: { categories: true },
  });

  if (!manga) notFound();

  const genres = manga.genres.split(",").filter(Boolean);
  const authors = manga.authors?.split(",").filter(Boolean) ?? [];

  const metadata = [
    { label: "Author", value: authors.length > 0 ? authors.join(", ") : "Unknown" },
    { label: "Publication Status", value: manga.publicationStatus ?? "Unknown" },
    { label: "Published From", value: formatDate(manga.publishedFrom) },
    { label: "Published To", value: formatDate(manga.publishedTo) },
    { label: "Chapters", value: manga.chapters ?? "Ongoing / Unknown" },
    { label: "Volumes", value: manga.volumes ?? "Ongoing / Unknown" },
    { label: "MAL Score", value: manga.malScore ?? "N/A" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-drift absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-[#E8C77E]/5 blur-[120px]" />
        <div className="animate-drift absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-[#1E2C42]/30 blur-[100px]" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        {/* Back link – now a subtle floating pill */}
        <Link
          href="/library"
          className="animate-fade-in-up group mb-10 inline-flex items-center gap-2 rounded-full border border-[#1E2C42] bg-[#0F1B2E]/80 px-4 py-2 font-mono text-xs uppercase tracking-wide text-[#8CA0BE] backdrop-blur-sm transition-all duration-300 hover:border-[#E8C77E]/40 hover:text-[#F5F5F0] hover:shadow-[0_0_25px_rgba(232,199,126,0.1)]"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Back to Library
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
          {/* LEFT COLUMN – Cover + Status & Rating */}
          <div className="flex flex-col gap-6">
            {/* Cover card with enhanced glow */}
            <div className="animate-fade-in-up group relative self-start overflow-hidden rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] shadow-lg transition-all duration-500 hover:border-[#E8C77E]/40 hover:shadow-[0_20px_50px_rgba(232,199,126,0.2)]">
              {/* Subtle gold ring on hover */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-[#E8C77E]/10 transition-all duration-500 group-hover:ring-[#E8C77E]/30" />
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl">
                {manga.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#8CA0BE]">
                    No cover
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-[#0B1220]/20 to-transparent" />
              </div>
            </div>

            {/* Status & Rating card – now fills the space below cover */}
            <div
              className="animate-fade-in-up overflow-hidden rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] shadow-lg"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex flex-col divide-y divide-[#1E2C42]">
                <div className="p-5">
                  <ReadingStatusEditor
                    mangaId={manga.id}
                    currentStatus={manga.readingStatus}
                  />
                </div>
                <div className="p-5">
                  <RatingEditor mangaId={manga.id} currentRating={manga.rating} />
                </div>
              </div>
            </div>

            {/* Quick decorative stat (optional, just to fill visual weight) */}
            <div
              className="animate-fade-in-up hidden rounded-2xl border border-dashed border-[#1E2C42] p-5 lg:block"
              style={{ animationDelay: "0.2s" }}
            >
              <p className="font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                Reading Progress
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1E2C42]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E8C77E]/80 to-[#E8C77E]"
                  style={{ width: `${Math.min(100, Math.random() * 80 + 10)}%` }}
                />
              </div>
              <p className="mt-2 text-right font-mono text-[10px] text-[#8CA0BE]">??%</p>
            </div>
          </div>

          {/* RIGHT COLUMN – Details */}
          <div className="flex flex-col">
            {/* Title with golden gradient accent */}
            <h1
              className="animate-fade-in-up mb-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight lg:text-5xl"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="text-gradient-gold">{manga.title}</span>
            </h1>

            {manga.siteUrl && (
              <a
                href={manga.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: "0.1s" }}
                className="animate-fade-in-up mb-6 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E8C77E]/30 bg-[#E8C77E]/5 px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E] backdrop-blur-sm transition-all duration-300 hover:bg-[#E8C77E] hover:text-[#0B1220] hover:shadow-[0_0_25px_rgba(232,199,126,0.3)]"
              >
                View on AniList ↗
              </a>
            )}

            {/* Genres – now a horizontal tag cloud with an accent line */}
            {genres.length > 0 && (
              <div
                className="animate-fade-in-up mb-8"
                style={{ animationDelay: "0.15s" }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
                  <span className="font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">Genres</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-[#E8C77E]/20 bg-[#E8C77E]/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-[#E8C77E] backdrop-blur-sm transition-all duration-200 hover:border-[#E8C77E]/50 hover:bg-[#E8C77E]/10"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata – now a 4-column grid on larger screens for compactness */}
            <div
              className="animate-fade-in-up mb-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-6 shadow-lg sm:grid-cols-3 lg:grid-cols-4"
              style={{ animationDelay: "0.2s" }}
            >
              {metadata.map((item) => (
                <div key={item.label}>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Synopsis – with a gold left accent bar */}
            <div
              className="animate-fade-in-up mb-8 overflow-hidden rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] shadow-lg"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="flex items-start gap-4 p-6">
                <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#E8C77E] to-transparent" />
                <div>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E]">
                    Synopsis
                  </p>
                  <p className="text-sm leading-relaxed text-[#8CA0BE]">
                    {manga.synopsis ?? "No synopsis available."}
                  </p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div
              className="animate-fade-in-up mb-8 rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-6 shadow-lg"
              style={{ animationDelay: "0.3s" }}
            >
              <CategoryManager mangaId={manga.id} assigned={manga.categories} />
            </div>

            {/* Delete button – with more visual breathing room */}
            <div
              className="animate-fade-in-up mt-auto border-t border-[#1E2C42] pt-8"
              style={{ animationDelay: "0.35s" }}
            >
              <DeleteMangaButton mangaId={manga.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryManager from "@/components/CategoryManager";
import ReadingStatusEditor from "@/components/ReadingStatusEditor";
import DeleteMangaButton from "@/components/DeleteMangaButton";
import RatingEditor from "@/components/RatingEditor";
import AmbientBackground from "@/components/AmbientBackground";
import CoverImage from "@/components/CoverImage";
import Chip from "@/components/Chip";
import { parseList } from "@/lib/manga";
import { LABEL, statusBadge } from "@/lib/ui";

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

  const genres = parseList(manga.genres);
  const authors = parseList(manga.authors);
  const statusInfo = statusBadge(manga.readingStatus);

  const mangafireUrl = `https://mangafire.to/browse?keyword=${encodeURIComponent(manga.title)}&sort=relevance:desc`;
  const comixUrl = `https://comix.to/browse?q=${encodeURIComponent(manga.title)}&sort=relevance%3Adesc`;

  const metadata = [
    { label: "Author", value: authors.length > 0 ? authors.join(", ") : "Unknown" },
    { label: "Publication Status", value: manga.publicationStatus ?? "Unknown" },
    { label: "Published From", value: formatDate(manga.publishedFrom) },
    { label: "Published To", value: formatDate(manga.publishedTo) },
    { label: "Total Chapters", value: manga.chapters ? `${manga.chapters} ch.` : "Ongoing / Unknown" },
    { label: "Total Volumes", value: manga.volumes ? `${manga.volumes} vol.` : "Unknown" },
    { label: "AniList Score", value: manga.malScore ? `⭐ ${manga.malScore}/10` : "Unrated" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      <AmbientBackground
        primary="-top-32 left-1/4 h-[550px] w-[550px] blur-[150px]"
        secondary="-bottom-40 right-1/4 h-[450px] w-[450px] blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        {/* Back Link */}
        <Link
          href="/library"
          className="animate-fade-in-up group mb-8 inline-flex items-center gap-2 rounded-full border border-[#1E2C42] bg-[#0F1B2E]/80 px-4 py-2 font-mono text-xs uppercase tracking-wide text-[#8CA0BE] backdrop-blur-md transition-all duration-300 hover:border-[#E8C77E]/50 hover:text-[#F5F5F0] hover:shadow-[0_0_25px_rgba(232,199,126,0.15)]"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          <span>Back to Library</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[340px_1fr]">
          {/* LEFT COLUMN: Cover, Status & Rating, Reader Links */}
          <div className="flex flex-col gap-6">
            {/* Cover card */}
            <div className="animate-fade-in-up group relative overflow-hidden rounded-3xl border border-[#1E2C42] bg-[#0F1B2E] shadow-2xl transition-all duration-500 hover:border-[#E8C77E]/60 hover:shadow-[0_20px_50px_rgba(232,199,126,0.2)]">
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0B1220]">
                <CoverImage
                  src={manga.coverUrl}
                  alt={manga.title}
                  imgClassName="transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-transparent to-transparent" />

                {/* Floating status tag */}
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Read Now External Links */}
            <div className="animate-fade-in-up space-y-2.5 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/90 p-4 shadow-xl backdrop-blur-md" style={{ animationDelay: "0.08s" }}>
              <p className={`mb-1 ${LABEL}`}>Read Online</p>
              
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={mangafireUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-500/10 py-2.5 font-mono text-xs uppercase tracking-wider text-red-300 transition-all hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  <span>🔥</span>
                  <span>MangaFire ↗</span>
                </a>

                <a
                  href={comixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 py-2.5 font-mono text-xs uppercase tracking-wider text-purple-300 transition-all hover:bg-purple-500 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  <span>⚡</span>
                  <span>Comix ↗</span>
                </a>
              </div>

              {manga.siteUrl && (
                <a
                  href={manga.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#1E2C42] bg-[#0B1220]/60 py-2 font-mono text-xs text-[#8CA0BE] transition-all hover:border-[#E8C77E]/50 hover:text-[#E8C77E]"
                >
                  <span>View Official AniList Page ↗</span>
                </a>
              )}
            </div>

            {/* Status & Rating Card */}
            <div
              className="animate-fade-in-up overflow-hidden rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/90 shadow-xl backdrop-blur-md"
              style={{ animationDelay: "0.12s" }}
            >
              <div className="divide-y divide-[#1E2C42]/80">
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
          </div>

          {/* RIGHT COLUMN: Info, Metadata, Synopsis, Tags */}
          <div className="flex flex-col">
            {/* Title */}
            <h1
              className="animate-fade-in-up mb-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="text-gradient-gold">{manga.title}</span>
            </h1>

            {/* Genres */}
            {genres.length > 0 && (
              <div
                className="animate-fade-in-up mb-6 flex flex-wrap gap-2"
                style={{ animationDelay: "0.1s" }}
              >
                {genres.map((genre) => (
                  <Chip key={genre} className="px-3.5 py-1 text-xs">
                    {genre}
                  </Chip>
                ))}
              </div>
            )}

            {/* Metadata Grid */}
            <div
              className="animate-fade-in-up mb-8 grid grid-cols-2 gap-3.5 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/70 p-6 shadow-xl backdrop-blur-md sm:grid-cols-3 lg:grid-cols-4"
              style={{ animationDelay: "0.15s" }}
            >
              {metadata.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#1E2C42]/60 bg-[#0B1220]/50 p-3.5">
                  <p className={LABEL}>{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#F5F5F0] truncate" title={item.value}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Synopsis Card */}
            <div
              className="animate-fade-in-up mb-8 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/70 p-6 shadow-xl backdrop-blur-md"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E8C77E]" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#E8C77E]">
                  Synopsis
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-[#8CA0BE] whitespace-pre-line">
                {manga.synopsis ?? "No synopsis available."}
              </p>
            </div>

            {/* Category Tags Manager */}
            <div
              className="animate-fade-in-up mb-8 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/70 p-6 shadow-xl backdrop-blur-md"
              style={{ animationDelay: "0.25s" }}
            >
              <CategoryManager mangaId={manga.id} assigned={manga.categories} />
            </div>

            {/* Danger Zone: Delete button */}
            <div
              className="animate-fade-in-up mt-auto border-t border-[#1E2C42]/80 pt-6"
              style={{ animationDelay: "0.3s" }}
            >
              <DeleteMangaButton mangaId={manga.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
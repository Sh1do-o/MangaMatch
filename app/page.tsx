import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const recentManga = await prisma.manga.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-drift absolute -top-32 left-1/3 h-[600px] w-[600px] rounded-full bg-[#E8C77E]/5 blur-[150px]" />
        <div className="animate-drift absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-[#1E2C42]/30 blur-[120px]" style={{ animationDelay: "-6s" }} />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#1E2C42] px-6 py-28">
        {/* Background collage image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Dark gradient overlay for text readability + brand tone */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220]/95 via-[#0B1220]/90 to-[#0B1220]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#1E2C42 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            backgroundPosition: "-8px -8px",
            opacity: 0.4,
          }}
        />
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-drift rounded-full bg-[#E8C77E]/10 blur-3xl" />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 animate-drift rounded-full bg-[#8CA0BE]/10 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="animate-fade-in-up mb-4 inline-block rounded-full border border-[#E8C77E]/30 bg-[#E8C77E]/5 backdrop-blur-sm px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-[#E8C77E]">
            Track · Filter · Discover
          </p>
          <h1
            className="animate-fade-in-up mb-5 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            Your manga, organized —
            <br />
            <span className="text-gradient-gold">your next read, found.</span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto mb-10 max-w-xl text-sm leading-relaxed text-[#8CA0BE]"
            style={{ animationDelay: "0.2s" }}
          >
            Build a library of what you're reading and what you've finished,
            then let AI-powered recommendations point you to what's next
            based on what you actually like.
          </p>
          <div
            className="animate-fade-in-up flex justify-center gap-3"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/library"
              className="group relative rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-7 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.35)] active:scale-95"
            >
              View Library
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-[#1E2C42] bg-[#0F1B2E]/80 backdrop-blur-sm px-7 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#F5F5F0] transition-all duration-300 hover:border-[#E8C77E]/50 hover:text-[#E8C77E] hover:shadow-[0_0_30px_rgba(232,199,126,0.15)] active:scale-95"
            >
              Search Manga
            </Link>
          </div>
        </div>
      </div>

      {/* Recently added — real data, manga-panel strip */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        {recentManga.length > 0 ? (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-[#E8C77E]/40 to-transparent" />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8C77E]">
                  Recently Added
                </p>
              </div>
              <Link
                href="/library"
                className="group flex items-center gap-1 rounded-full border border-[#1E2C42] px-4 py-2 font-mono text-xs uppercase tracking-wide text-[#8CA0BE] transition-all duration-200 hover:border-[#E8C77E]/40 hover:text-[#E8C77E]"
              >
                View all
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {recentManga.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/library/${m.id}`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                  className="animate-fade-in-up group relative aspect-[2/3] overflow-hidden rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#E8C77E]/50 hover:shadow-[0_10px_40px_rgba(232,199,126,0.2)]"
                >
                  {m.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.coverUrl}
                      alt={m.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center font-mono text-[9px] uppercase tracking-wide text-[#8CA0BE]">
                      {m.title}
                    </div>
                  )}
                  {/* Gradient overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {/* Shimmer sweep */}
                  <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1E2C42] px-6 py-16 text-center">
            <p className="mb-4 text-sm text-[#8CA0BE]">
              Your library is empty. Search for manga to get started.
            </p>
            <Link
              href="/search"
              className="inline-block rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.35)]"
            >
              Go to Search
            </Link>
          </div>
        )}
      </div>

      {/* Discovery CTA */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-8 shadow-lg transition-all duration-300 hover:border-[#E8C77E]/30 sm:p-10">
          {/* Background glow */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#E8C77E]/5 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E8C77E]/30 bg-[#E8C77E]/10">
                <svg className="h-6 w-6 text-[#E8C77E]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl font-semibold">
                Ready for something new?
              </h3>
              <p className="text-sm text-[#8CA0BE]">
                Let our AI analyze your tastes and suggest manga you'll love, hand‑picked from your reading history.
              </p>
            </div>
            <Link
              href="/recommendations"
              className="shrink-0 rounded-full border border-[#E8C77E] bg-[#E8C77E] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:bg-[#F5F5F0] hover:border-[#F5F5F0] hover:shadow-[0_0_30px_rgba(232,199,126,0.4)] active:scale-95"
            >
              Get Recommendations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
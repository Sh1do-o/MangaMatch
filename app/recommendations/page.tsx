"use client";

import { useEffect, useState } from "react";

interface SavedManga {
  id: number;
  title: string;
  genres: string;
  synopsis: string | null;
  coverUrl: string | null;
}

interface Recommendation {
  title: string;
  synopsis: string;
  reason: string;
  malId?: number | null;
  coverUrl?: string | null;
  genres?: string[];
  chapters?: number | null;
  status?: string | null;
  siteUrl?: string | null;
}

const completionOptions = [
  { value: "any", label: "Any" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const chapterLengthOptions = [
  { value: "any", label: "Any" },
  { value: "short", label: "Short (< 100 ch.)" },
  { value: "medium", label: "Medium (100-400 ch.)" },
  { value: "long", label: "Long (400+ ch.)" },
];

const contentRatingOptions = [
  { value: "any", label: "Any" },
  { value: "safe", label: "Safe / All Ages" },
  { value: "mature", label: "Mature" },
];

const STANDARD_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Historical",
  "Isekai",
  "Mecha",
  "Music",
  "School",
  "Seinen",
  "Shoujo",
  "Shounen",
  "Josei",
  "Ecchi",
  "Martial Arts",
  "Tragedy",
];

export default function RecommendationsPage() {
  const [library, setLibrary] = useState<SavedManga[]>([]);
  const [step, setStep] = useState<"filters" | "base" | "results">("filters");

  // Filter state
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [completionStatus, setCompletionStatus] = useState("any");
  const [chapterLength, setChapterLength] = useState("any");
  const [contentRating, setContentRating] = useState("any");
  const [baseMangaIds, setBaseMangaIds] = useState<Set<number>>(new Set());
  const [customQuery, setCustomQuery] = useState("");

  // Results state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRec, setConfirmingRec] = useState<Recommendation | null>(null);
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  useEffect(() => {
    fetch("/api/manga/list")
      .then((r) => r.json())
      .then((data) => setLibrary(data.manga ?? []));
  }, []);

  const allGenres = STANDARD_GENRES;

  const baseCandidates =
    selectedGenres.size === 0
      ? library
      : library.filter((m) =>
          m.genres.split(",").some((g) => selectedGenres.has(g))
        );

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      next.has(genre) ? next.delete(genre) : next.add(genre);
      return next;
    });
  }

  function toggleBaseManga(id: number) {
    setBaseMangaIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function fetchRecommendations(diverge = false) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genres: Array.from(selectedGenres),
          completionStatus,
          chapterLength,
          contentRating,
          baseMangaIds: Array.from(baseMangaIds),
          diverge,
          customQuery,
          excludeTitles: [
            ...Array.from(dismissed),
            ...recommendations.map((r) => r.title),
          ],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      setRecommendations(data.recommendations);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function markAlreadyRead(rec: Recommendation) {
    setConfirmingRec(rec);
  }

  async function confirmAddToLibrary() {
    if (!confirmingRec) return;
    setAddingToLibrary(true);

    try {
      if (confirmingRec.malId) {
        await fetch("/api/manga/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            malId: confirmingRec.malId,
            title: confirmingRec.title,
            genres: confirmingRec.genres ?? [],
            coverUrl: confirmingRec.coverUrl ?? null,
            synopsis: confirmingRec.synopsis,
            status: confirmingRec.status ?? null,
            authors: [],
            publishedFrom: null,
            publishedTo: null,
            chapters: confirmingRec.chapters ?? null,
            volumes: null,
            score: null,
            siteUrl: confirmingRec.siteUrl ?? null,
          }),
        });
      }
      dismissRecommendation(confirmingRec.title);
    } finally {
      setAddingToLibrary(false);
      setConfirmingRec(null);
    }
  }

  function declineAddToLibrary() {
    if (!confirmingRec) return;
    dismissRecommendation(confirmingRec.title);
    setConfirmingRec(null);
  }

  function dismissRecommendation(title: string) {
    setDismissed((prev) => new Set(prev).add(title));
    setRecommendations((prev) => prev.filter((r) => r.title !== title));
  }

  const selectedBaseManga = library.filter((m) => baseMangaIds.has(m.id));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-drift absolute -top-24 right-1/4 h-[500px] w-[500px] rounded-full bg-[#E8C77E]/5 blur-[130px]" />
        <div className="animate-drift absolute bottom-1/3 -left-20 h-[400px] w-[400px] rounded-full bg-[#1E2C42]/30 blur-[100px]" style={{ animationDelay: "-4s" }} />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header with decorative gold lines */}
        <div className="animate-fade-in-up mb-12 border-b border-[#1E2C42] pb-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8C77E]">
              Recommend
            </p>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight lg:text-5xl">
            <span className="text-gradient-gold">What should you read next?</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8CA0BE]">
            Fine‑tune your preferences and let your library guide you to something new.
          </p>
        </div>

        {/* Step indicator – enhanced with subtle background */}
        <div className="animate-fade-in-up mb-10 flex items-center gap-2" style={{ animationDelay: "0.05s" }}>
          {(["filters", "base", "results"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] transition-all duration-300 ${
                  step === s
                    ? "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220]"
                    : "border-[#1E2C42] text-[#8CA0BE]"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`font-mono text-xs uppercase tracking-wide ${
                  step === s ? "text-[#F5F5F0]" : "text-[#8CA0BE]"
                }`}
              >
                {s === "filters" ? "Filters" : s === "base" ? "Base Manga" : "Results"}
              </span>
              {i < 2 && <div className="mx-1 h-px w-6 bg-[#1E2C42]" />}
            </div>
          ))}
        </div>

        {/* Step 1: Filters */}
        {step === "filters" && (
          <div className="space-y-8">
            {/* Genres */}
            {allGenres.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                  Genres (select any that apply)
                </p>
                <div className="flex flex-wrap gap-2">
                  {allGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                        selectedGenres.has(genre)
                          ? "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220]"
                          : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#E8C77E]/40 hover:text-[#E8C77E]"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter groups with enhanced design */}
            <FilterGroup
              label="Completion Status"
              options={completionOptions}
              value={completionStatus}
              onChange={setCompletionStatus}
            />
            <FilterGroup
              label="Chapter Length"
              options={chapterLengthOptions}
              value={chapterLength}
              onChange={setChapterLength}
            />
            <FilterGroup
              label="Content Rating"
              options={contentRatingOptions}
              value={contentRating}
              onChange={setContentRating}
            />

            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                Anything else? (optional)
              </p>
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="e.g. no isekai, something with a slower pace, avoid harem tropes..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-[#1E2C42] bg-[#0F1B2E] px-4 py-3 text-sm text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none transition-all duration-300 focus:border-[#E8C77E]/50 focus:shadow-[0_0_20px_rgba(232,199,126,0.1)]"
              />
            </div>

            <button
              onClick={() => setStep("base")}
              className="rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-7 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.35)] active:scale-95"
            >
              Next: Choose a Base Manga →
            </button>
          </div>
        )}

        {/* Step 2: Base manga selection */}
        {step === "base" && (
          <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <p className="mb-1 text-sm text-[#8CA0BE]">
              Pick one or more manga from your library that are similar to
              what you want — this anchors the recommendations. (Optional —
              skip if you just want genre-based suggestions.)
            </p>
            <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {baseCandidates.map((m) => {
                const selected = baseMangaIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleBaseManga(m.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-[#E8C77E] bg-[#0F1B2E] shadow-[0_0_20px_rgba(232,199,126,0.1)]"
                        : "border-[#1E2C42] hover:border-[#F5F5F0]/40"
                    }`}
                  >
                    <p className="text-xs font-semibold leading-snug">
                      {m.title}
                    </p>
                    {m.genres && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                        {m.genres.split(",").slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </button>
                );
              })}
              {baseCandidates.length === 0 && (
                <p className="col-span-3 text-xs text-[#8CA0BE]">
                  No manga in your library match those genres yet.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("filters")}
                className="rounded-full border border-[#1E2C42] px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#8CA0BE] transition-all duration-300 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
              >
                ← Back
              </button>
              <button
                onClick={() => fetchRecommendations(false)}
                disabled={loading}
                className="rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-7 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.35)] active:scale-95 disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Get Recommendations"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            {selectedBaseManga.length > 0 && (
              <p className="mb-6 text-xs text-[#8CA0BE]">
                Based on{" "}
                <span className="text-[#F5F5F0]">
                  {selectedBaseManga.map((m) => m.title).join(", ")}
                </span>
                {selectedGenres.size > 0 &&
                  ` and ${Array.from(selectedGenres).join(", ")}`}
              </p>
            )}

            {error && (
              <div className="mb-6 rounded-xl border border-[#4A2A2A] bg-[#1A0F0F] px-4 py-3 text-sm text-[#E8A0A0]">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div
                  key={rec.title}
                  style={{ animationDelay: `${Math.min(i, 8) * 0.08}s` }}
                  className="animate-fade-in-up group flex gap-4 rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-5 shadow-lg transition-all duration-300 hover:border-[#E8C77E]/30 hover:shadow-[0_10px_40px_rgba(232,199,126,0.1)]"
                >
                  {/* Cover */}
                  <div className="relative aspect-[2/3] w-24 flex-shrink-0 self-start overflow-hidden rounded-lg border border-[#1E2C42] bg-[#0B1220]">
                    {rec.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rec.coverUrl}
                        alt={rec.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center font-mono text-[9px] uppercase tracking-wide text-[#8CA0BE]">
                        No Cover
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">
                      {rec.title}
                    </h3>

                    <div className="mb-2 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                      <span>{rec.status ?? "Status unknown"}</span>
                      <span>
                        {rec.chapters
                          ? `${rec.chapters} chapters`
                          : "Chapters unknown"}
                      </span>
                    </div>

                    {rec.genres && rec.genres.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {rec.genres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-[#E8C77E]/20 bg-[#E8C77E]/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mb-3 text-sm leading-relaxed text-[#8CA0BE]">
                      {rec.synopsis}
                    </p>
                    <p className="mb-4 rounded-r-lg border-l-2 border-[#E8C77E]/40 bg-[#E8C77E]/[0.03] py-2 pl-3 text-xs italic leading-relaxed text-[#E8C77E]">
                      ✦ {rec.reason}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => markAlreadyRead(rec)}
                        className="rounded-full border border-[#1E2C42] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE] transition-all duration-200 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
                      >
                        Already Read
                      </button>
                      {rec.siteUrl && (
                        <a
                          href={rec.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[#E8C77E]/40 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E] transition-all duration-200 hover:bg-[#E8C77E] hover:text-[#0B1220]"
                        >
                          View Full Details ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {recommendations.length === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-[#1E2C42] px-6 py-16 text-center">
                <p className="text-sm text-[#8CA0BE]">
                  No more recommendations found. Try adjusting your filters or use &quot;Diverge&quot; to explore further.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setStep("filters")}
                className="rounded-full border border-[#1E2C42] px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#8CA0BE] transition-all duration-300 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
              >
                ← Start Over
              </button>
              <button
                onClick={() => fetchRecommendations(false)}
                disabled={loading}
                className="rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.35)] active:scale-95 disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Suggest More"}
              </button>
              <button
                onClick={() => fetchRecommendations(true)}
                disabled={loading}
                className="rounded-full border border-[#E8C77E] px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#E8C77E] transition-all duration-300 hover:bg-[#E8C77E] hover:text-[#0B1220] hover:shadow-[0_0_30px_rgba(232,199,126,0.3)] active:scale-95 disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Diverge"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Already Read confirmation modal */}
      {confirmingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-6 shadow-2xl">
            <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#F5F5F0]">
              Add to library?
            </h3>
            <p className="mb-6 text-sm text-[#8CA0BE]">
              Add <span className="text-[#F5F5F0]">{confirmingRec.title}</span>{" "}
              to your library as well as marking it already read?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAddToLibrary}
                disabled={addingToLibrary}
                className="flex-1 rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,245,240,0.3)] active:scale-95 disabled:opacity-50"
              >
                {addingToLibrary ? "Adding..." : "Yes, add it"}
              </button>
              <button
                onClick={declineAddToLibrary}
                disabled={addingToLibrary}
                className="flex-1 rounded-full border border-[#1E2C42] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#8CA0BE] transition-all duration-300 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0] disabled:opacity-50"
              >
                No, just dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
              value === opt.value
                ? "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220]"
                : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
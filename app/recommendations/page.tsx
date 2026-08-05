"use client";

import { useEffect, useState } from "react";
import { ANILIST_GENRES, isAniListGenre } from "@/lib/anilist";

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

// AniList genres, queried with `genre:`. Hentai is left out — it can never
// appear anyway, since the candidate queries are isAdult: false.
const GENRE_OPTIONS = ANILIST_GENRES.filter((g) => g !== "Hentai");

// AniList *tags*, not genres — `media(genre: "Isekai")` matches nothing, so
// these are queried through `tag_in` instead.
const THEME_OPTIONS = [
  "Isekai",
  "School",
  "Historical",
  "Martial Arts",
  "Tragedy",
  "Shounen",
  "Shoujo",
  "Seinen",
  "Josei",
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
  // Every title suggested so far this run, not just the batch on screen —
  // otherwise "Suggest More" can re-suggest an earlier batch.
  const [seenTitles, setSeenTitles] = useState<Set<string>>(new Set());
  const [poolPage, setPoolPage] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRec, setConfirmingRec] = useState<Recommendation | null>(null);
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  useEffect(() => {
    fetchLibrary()
      .then(setLibrary)
      .catch(() => setLibrary([]));
  }, []);

  // Library genres come from AniList's genre list, so only genre selections
  // (not tag selections) can match them.
  const selectedLibraryGenres = Array.from(selectedGenres).filter(isAniListGenre);

  const baseCandidates =
    selectedLibraryGenres.length === 0
      ? library
      : library.filter((m) =>
          m.genres.split(",").some((g) => selectedLibraryGenres.includes(g))
        );

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) => toggleSetItem(prev, genre));
  }

  function toggleBaseManga(id: number) {
    setBaseMangaIds((prev) => toggleSetItem(prev, id));
  }

  async function fetchRecommendations(diverge = false, fresh = false) {
    setLoading(true);
    setError(null);
    setNote(null);

    const excludeTitles = fresh
      ? []
      : [...Array.from(dismissed), ...Array.from(seenTitles)];
    const page = fresh ? 1 : poolPage + 1;

    try {
      const data = await fetchJson<{ recommendations: Recommendation[] }>(
        "/api/recommend",
        jsonRequest("POST", {
          genres: Array.from(selectedGenres),
          completionStatus,
          chapterLength,
          contentRating,
          baseMangaIds: Array.from(baseMangaIds),
          diverge,
          customQuery,
          excludeTitles,
          page,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      const batch: Recommendation[] = data.recommendations ?? [];
      setRecommendations(batch);
      setNote(data.note ?? null);
      setPoolPage(page);
      setSeenTitles((prev) => {
        const next = fresh ? new Set<string>() : new Set(prev);
        for (const rec of batch) next.add(rec.title);
        return next;
      });
      if (fresh) setDismissed(new Set());
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
        await addMangaToLibrary({
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
      <AmbientBackground
        primary="-top-24 right-1/4 h-[500px] w-[500px] blur-[130px]"
        secondary="bottom-1/3 -left-20 h-[400px] w-[400px] blur-[100px]"
        secondaryDelay="-4s"
      />

      <div className="mx-auto max-w-5xl px-6 py-16">
        <PageHeader
          eyebrow="Recommend"
          title="What should you read next?"
          description="Fine‑tune your preferences and let your library guide you to something new."
        />

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
            {/* Genres and themes */}
            <div className="space-y-6">
              {[
                { label: "Genres (select any that apply)", values: GENRE_OPTIONS },
                { label: "Themes (select any that apply)", values: THEME_OPTIONS },
              ].map((group) => (
                <div key={group.label}>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((genre) => (
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
              ))}
            </div>

            {/* Filter groups with enhanced design */}
            <FilterGroup
              label="Completion Status"
              options={COMPLETION_STATUS_OPTIONS}
              value={completionStatus}
              onChange={setCompletionStatus}
            />
            <FilterGroup
              label="Chapter Length"
              options={CHAPTER_LENGTH_OPTIONS}
              value={chapterLength}
              onChange={setChapterLength}
            />
            <FilterGroup
              label="Content Rating"
              options={CONTENT_RATING_OPTIONS}
              value={contentRating}
              onChange={setContentRating}
            />

            <div>
              <p className={`mb-3 ${LABEL}`}>Anything else? (optional)</p>
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
              className={cn(BUTTON_PRIMARY, "px-7 py-3.5")}
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
                      <p className={`mt-1 ${LABEL}`}>
                        {parseList(m.genres).slice(0, 3).join(" · ")}
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
                className={cn(BUTTON_SECONDARY, "px-6 py-3.5")}
              >
                ← Back
              </button>
              <button
                onClick={() => fetchRecommendations(false, true)}
                disabled={loading}
                className={cn(BUTTON_PRIMARY, "px-7 py-3.5")}
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

            {error && <ErrorBanner className="mb-6">{error}</ErrorBanner>}

            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div
                  key={rec.title}
                  style={{ animationDelay: `${Math.min(i, 8) * 0.08}s` }}
                  className="animate-fade-in-up group flex gap-4 rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-5 shadow-lg transition-all duration-300 hover:border-[#E8C77E]/30 hover:shadow-[0_10px_40px_rgba(232,199,126,0.1)]"
                >
                  {/* Cover */}
                  <div className="relative aspect-[2/3] w-24 flex-shrink-0 self-start overflow-hidden rounded-lg border border-[#1E2C42] bg-[#0B1220]">
                    <CoverImage
                      src={rec.coverUrl ?? null}
                      alt={rec.title}
                      imgClassName="transition-transform duration-300 group-hover:scale-105"
                      fallback={
                        <div className="flex h-full items-center justify-center px-2 text-center font-mono text-[9px] uppercase tracking-wide text-[#8CA0BE]">
                          No Cover
                        </div>
                      }
                    />
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
                          <Chip key={genre}>{genre}</Chip>
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
                      <TogglePill
                        active={false}
                        onClick={() => markAlreadyRead(rec)}
                        className="px-3.5 py-1.5 text-[10px]"
                      >
                        Already Read
                      </TogglePill>
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
              <EmptyState>
                <p className="text-sm text-[#8CA0BE]">
                  {note ??
                    'No more recommendations found. Try adjusting your filters or use "Diverge" to explore further.'}
                </p>
              </EmptyState>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setStep("filters")}
                className={cn(BUTTON_SECONDARY, "px-6 py-3.5")}
              >
                ← Start Over
              </button>
              <button
                onClick={() => fetchRecommendations(false)}
                disabled={loading}
                className={cn(BUTTON_PRIMARY, "px-6 py-3.5")}
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
        <Modal title="Add to library?">
          <div>
            <p className="mb-6 text-sm text-[#8CA0BE]">
              Add <span className="text-[#F5F5F0]">{confirmingRec.title}</span>{" "}
              to your library as well as marking it already read?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAddToLibrary}
                disabled={addingToLibrary}
                className={cn(BUTTON_PRIMARY, "flex-1 px-4 py-2.5")}
              >
                {addingToLibrary ? "Adding..." : "Yes, add it"}
              </button>
              <button
                onClick={declineAddToLibrary}
                disabled={addingToLibrary}
                className={cn(BUTTON_SECONDARY, "flex-1 px-4 py-2.5")}
              >
                No, just dismiss
              </button>
            </div>
          </div>
        </Modal>
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
      <p className={`mb-3 ${LABEL}`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <TogglePill
            key={opt.value}
            active={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </TogglePill>
        ))}
      </div>
    </div>
  );
}
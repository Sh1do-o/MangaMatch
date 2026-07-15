"use client";

import { useEffect, useState } from "react";
import type { MangaResult, BrowseSort } from "@/lib/anilist";

const BROWSE_TABS: { value: BrowseSort; label: string }[] = [
  { value: "trending", label: "🔥 Trending Now" },
  { value: "popular", label: "⭐ All-Time Popular" },
  { value: "top-rated", label: "🏆 Top Rated" },
];

const BROWSE_GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

interface Category {
  id: number;
  name: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingManga, setPendingManga] = useState<MangaResult | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [confirmingAdd, setConfirmingAdd] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const [browseTab, setBrowseTab] = useState<BrowseSort>("trending");
  const [browseGenre, setBrowseGenre] = useState("All");
  const [browseCache, setBrowseCache] = useState<Record<string, MangaResult[]>>({});
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError] = useState<string | null>(null);

  const browseKey = `${browseTab}-${browseGenre}`;
  const browseResults = browseCache[browseKey];

  useEffect(() => {
    if (browseCache[browseKey]) return; // already fetched, reuse from cache

    setBrowseLoading(true);
    setBrowseError(null);

    const params = new URLSearchParams({ sort: browseTab });
    if (browseGenre !== "All") params.set("genre", browseGenre);

    fetch(`/api/manga/trending?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.details || data.error);
        setBrowseCache((prev) => ({ ...prev, [browseKey]: data.results ?? [] }));
      })
      .catch((err) => setBrowseError(err.message ?? "Failed to load"))
      .finally(() => setBrowseLoading(false));
  }, [browseKey, browseCache, browseTab, browseGenre]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/manga/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Search failed");
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal(manga: MangaResult) {
    setPendingManga(manga);
    setSelectedCategoryId(null);
  }

  async function confirmAdd() {
    if (!pendingManga) return;
    const manga = pendingManga;

    setConfirmingAdd(true);
    setAddedIds((prev) => new Set(prev).add(manga.malId));

    try {
      const res = await fetch("/api/manga/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manga),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      if (selectedCategoryId && data.manga?.id) {
        await fetch(`/api/manga/${data.manga.id}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: selectedCategoryId }),
        });
      }
    } catch {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(manga.malId);
        return next;
      });
    } finally {
      setConfirmingAdd(false);
      setPendingManga(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-drift absolute -top-20 right-1/3 h-[450px] w-[450px] rounded-full bg-[#E8C77E]/5 blur-[130px]" />
        <div className="animate-drift absolute -bottom-32 left-1/4 h-[400px] w-[400px] rounded-full bg-[#1E2C42]/30 blur-[100px]" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header with decorative gold bar */}
        <div className="animate-fade-in-up mb-12 border-b border-[#1E2C42] pb-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8C77E]">
              Library / Search
            </p>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8C77E]/40 to-transparent" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight lg:text-5xl">
            <span className="text-gradient-gold">Find your next read</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8CA0BE]">
            Search by title. Add anything you're reading, have read, or want
            to track — this builds the library your recommendations are
            based on.
          </p>
        </div>

        {/* Search bar with glassmorphism and glow */}
        <form onSubmit={handleSearch} className="animate-fade-in-up mb-10 flex gap-3" style={{ animationDelay: "0.1s" }}>
          <div className="group relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Vagabond, Vinland Saga, Berserk..."
              className="w-full rounded-full border border-[#1E2C42] bg-[#0F1B2E]/80 px-5 py-3.5 pl-12 text-sm text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none backdrop-blur-sm transition-all duration-300 focus:border-[#E8C77E]/50 focus:shadow-[0_0_25px_rgba(232,199,126,0.15)]"
            />
            {/* Search icon inside input */}
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8CA0BE] transition-colors duration-300 group-focus-within:text-[#E8C77E]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[#F5F5F0] px-7 py-3.5 text-sm font-semibold text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,245,240,0.4)] active:scale-95 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Error state */}
        {error && (
          <div className="animate-fade-in-up mb-10 rounded-xl border border-[#4A2A2A] bg-[#1A0F0F] px-5 py-4 text-sm text-[#E8A0A0] shadow-lg">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E]"
              >
                <div className="aspect-[2/3] w-full bg-[#1E2C42]" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 rounded bg-[#1E2C42]" />
                  <div className="h-4 w-1/2 rounded bg-[#1E2C42]" />
                  <div className="h-4 w-full rounded bg-[#1E2C42]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Browse — shown before any search has been made */}
        {!hasSearched && !error && (
          <div className="animate-fade-in-up">
            {/* Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {BROWSE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setBrowseTab(tab.value)}
                  className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                    browseTab === tab.value
                      ? "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220]"
                      : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#E8C77E]/40 hover:text-[#E8C77E]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Genre filter — layers on top of whichever tab is active */}
            <div className="mb-8 flex flex-wrap gap-1.5">
              {BROWSE_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setBrowseGenre(genre)}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition-all duration-200 ${
                    browseGenre === genre
                      ? "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220]"
                      : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {browseError && (
              <div className="mb-8 rounded-xl border border-[#4A2A2A] bg-[#1A0F0F] px-5 py-4 text-sm text-[#E8A0A0]">
                {browseError}
              </div>
            )}

            {browseLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E]"
                  >
                    <div className="aspect-[2/3] w-full bg-[#1E2C42]" />
                    <div className="space-y-3 p-4">
                      <div className="h-5 w-3/4 rounded bg-[#1E2C42]" />
                      <div className="h-4 w-1/2 rounded bg-[#1E2C42]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : browseResults && browseResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {browseResults.map((manga, i) => (
                  <MangaCard
                    key={manga.malId}
                    manga={manga}
                    index={i}
                    isAdded={addedIds.has(manga.malId)}
                    onAdd={openAddModal}
                  />
                ))}
              </div>
            ) : (
              !browseError && (
                <div className="rounded-2xl border border-dashed border-[#1E2C42] px-6 py-20 text-center">
                  <p className="text-sm text-[#8CA0BE]">
                    No results for this combination. Try a different genre.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* No results found for an actual search */}
        {hasSearched && !loading && !error && results.length === 0 && (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-[#1E2C42] px-6 py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#1E2C42] bg-[#0F1B2E]">
              <svg className="h-8 w-8 text-[#E8C77E]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="mb-2 font-semibold text-[#F5F5F0]">No results found</p>
            <p className="text-sm text-[#8CA0BE]">
              Try a different title or check the spelling.
            </p>
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <>
            {/* Decorative results header */}
            <div className="animate-fade-in-up mb-6 flex items-center gap-3" style={{ animationDelay: "0.1s" }}>
              <span className="h-px w-8 bg-gradient-to-r from-[#E8C77E]/40 to-transparent" />
              <span className="font-mono text-xs uppercase tracking-wide text-[#E8C77E]">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
              <span className="h-px flex-1 bg-[#1E2C42]" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((manga, i) => (
                <MangaCard
                  key={manga.malId}
                  manga={manga}
                  index={i}
                  isAdded={addedIds.has(manga.malId)}
                  onAdd={openAddModal}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Category picker modal — shown when adding to library */}
      {pendingManga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-6 shadow-2xl">
            <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#F5F5F0]">
              Add to library
            </h3>
            <p className="mb-5 text-sm text-[#8CA0BE]">
              Adding <span className="text-[#F5F5F0]">{pendingManga.title}</span>.
              {categories.length > 0 && " Pick a category, or skip."}
            </p>

            {categories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                    selectedCategoryId === null
                      ? "border-[#F5F5F0] bg-[#F5F5F0] text-[#0B1220]"
                      : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0]"
                  }`}
                >
                  No Category
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                      selectedCategoryId === cat.id
                        ? "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220]"
                        : "border-[#1E2C42] text-[#8CA0BE] hover:border-[#E8C77E]/40 hover:text-[#E8C77E]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmAdd}
                disabled={confirmingAdd}
                className="flex-1 rounded-full border border-[#F5F5F0] bg-[#F5F5F0] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,245,240,0.3)] active:scale-95 disabled:opacity-50"
              >
                {confirmingAdd ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => setPendingManga(null)}
                disabled={confirmingAdd}
                className="flex-1 rounded-full border border-[#1E2C42] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#8CA0BE] transition-all duration-300 hover:border-[#F5F5F0]/40 hover:text-[#F5F5F0] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MangaCard({
  manga,
  index,
  isAdded,
  onAdd,
}: {
  manga: MangaResult;
  index: number;
  isAdded: boolean;
  onAdd: (manga: MangaResult) => void;
}) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
      className="animate-fade-in-up group flex flex-col overflow-hidden rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#E8C77E]/40 hover:shadow-[0_10px_40px_rgba(232,199,126,0.15)]"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0B1220]">
        {manga.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#8CA0BE]">
            No cover
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-transparent to-transparent" />
        {/* Shimmer sweep on hover */}
        <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold leading-snug">
          {manga.title}
        </h3>

        {manga.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {manga.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-[#E8C77E]/20 bg-[#E8C77E]/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E] backdrop-blur-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {manga.synopsis && (
          <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-[#8CA0BE]">
            {manga.synopsis}
          </p>
        )}

        <button
          onClick={() => onAdd(manga)}
          disabled={isAdded}
          className={`mt-auto w-full rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${
            isAdded
              ? "border-[#1E2C42] bg-transparent text-[#8CA0BE]"
              : "border-[#E8C77E] bg-[#E8C77E] text-[#0B1220] hover:bg-[#F5F5F0] hover:border-[#F5F5F0] hover:shadow-[0_0_25px_rgba(232,199,126,0.35)] active:scale-95"
          }`}
        >
          {isAdded ? "✓ Added" : "+ Add to Library"}
        </button>
      </div>
    </div>
  );
}
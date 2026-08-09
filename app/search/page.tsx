"use client";

import { useEffect, useState } from "react";
import type { MangaResult, BrowseSort } from "@/lib/anilist";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import CoverImage from "@/components/CoverImage";
import Chip from "@/components/Chip";
import TogglePill from "@/components/TogglePill";
import MangaCardSkeletons from "@/components/MangaCardSkeletons";
import ResultsHeader from "@/components/ResultsHeader";
import {
  addMangaToLibrary,
  fetchCategories,
  setMangaCategory,
} from "@/lib/api-client";
import { fetchJson } from "@/lib/http";
import { BROWSE_GENRES } from "@/lib/genres";
import { toggleSetItem } from "@/lib/manga";
import type { Category } from "@/lib/types";
import { cn, BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/lib/ui";

const BROWSE_TABS: { value: BrowseSort; label: string }[] = [
  { value: "trending", label: "🔥 Trending Now" },
  { value: "popular", label: "⭐ All-Time Popular" },
  { value: "top-rated", label: "🏆 Top Rated" },
];

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
    fetchCategories()
      .then(setCategories)
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

    fetchJson<{ results: MangaResult[] }>(
      `/api/manga/trending?${params.toString()}`
    )
      .then((data) => {
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
      const data = await fetchJson<{ results: MangaResult[] }>(
        `/api/manga/search?q=${encodeURIComponent(query)}`
      );
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
      const saved = await addMangaToLibrary(manga);

      if (selectedCategoryId && saved?.id) {
        await setMangaCategory(saved.id, selectedCategoryId, false);
      }
    } catch {
      setAddedIds((prev) => toggleSetItem(prev, manga.malId));
    } finally {
      setConfirmingAdd(false);
      setPendingManga(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      <AmbientBackground
        primary="-top-20 right-1/3 h-[450px] w-[450px] blur-[130px]"
        secondary="-bottom-32 left-1/4 h-[400px] w-[400px] blur-[100px]"
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <PageHeader
          eyebrow="Library / Search"
          title="Find your next read"
          description="Search by title. Add anything you're reading, have read, or want to track — this builds the library your recommendations are based on."
        />

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

        {error && (
          <ErrorBanner className="animate-fade-in-up mb-10 shadow-lg">
            <span className="font-semibold">Error:</span> {error}
          </ErrorBanner>
        )}

        {loading && <MangaCardSkeletons className="mb-10" lines={3} />}

        {/* Browse — shown before any search has been made */}
        {!hasSearched && !error && (
          <div className="animate-fade-in-up">
            {/* Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {BROWSE_TABS.map((tab) => (
                <TogglePill
                  key={tab.value}
                  active={browseTab === tab.value}
                  onClick={() => setBrowseTab(tab.value)}
                  accent="gold"
                  className="px-4 py-2 text-xs"
                >
                  {tab.label}
                </TogglePill>
              ))}
            </div>

            {/* Genre filter — layers on top of whichever tab is active */}
            <div className="mb-8 flex flex-wrap gap-1.5">
              {BROWSE_GENRES.map((genre) => (
                <TogglePill
                  key={genre}
                  active={browseGenre === genre}
                  onClick={() => setBrowseGenre(genre)}
                  className="px-3 py-1 text-[10px]"
                >
                  {genre}
                </TogglePill>
              ))}
            </div>

            {browseError && (
              <ErrorBanner className="mb-8">{browseError}</ErrorBanner>
            )}

            {browseLoading ? (
              <MangaCardSkeletons />
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
                <EmptyState className="py-20">
                  <p className="text-sm text-[#8CA0BE]">
                    No results for this combination. Try a different genre.
                  </p>
                </EmptyState>
              )
            )}
          </div>
        )}

        {/* No results found for an actual search */}
        {hasSearched && !loading && !error && results.length === 0 && (
          <EmptyState className="animate-fade-in-up py-20">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#1E2C42] bg-[#0F1B2E]">
              <svg className="h-8 w-8 text-[#E8C77E]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="mb-2 font-semibold text-[#F5F5F0]">No results found</p>
            <p className="text-sm text-[#8CA0BE]">
              Try a different title or check the spelling.
            </p>
          </EmptyState>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <>
            <ResultsHeader style={{ animationDelay: "0.1s" }}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </ResultsHeader>

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
        <Modal title="Add to library">
          <div>
            <p className="mb-5 text-sm text-[#8CA0BE]">
              Adding <span className="text-[#F5F5F0]">{pendingManga.title}</span>.
              {categories.length > 0 && " Pick a category, or skip."}
            </p>

            {categories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <TogglePill
                  active={selectedCategoryId === null}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  No Category
                </TogglePill>
                {categories.map((cat) => (
                  <TogglePill
                    key={cat.id}
                    active={selectedCategoryId === cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    accent="gold"
                  >
                    {cat.name}
                  </TogglePill>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmAdd}
                disabled={confirmingAdd}
                className={cn(BUTTON_PRIMARY, "flex-1 px-4 py-2.5")}
              >
                {confirmingAdd ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => setPendingManga(null)}
                disabled={confirmingAdd}
                className={cn(BUTTON_SECONDARY, "flex-1 px-4 py-2.5")}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
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
        <CoverImage
          src={manga.coverUrl}
          alt={manga.title}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
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
              <Chip key={genre}>{genre}</Chip>
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
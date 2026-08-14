"use client";

import { useEffect, useState } from "react";
import type { MangaResult, BrowseSort } from "@/lib/anilist";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
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
import { cn, BUTTON_PRIMARY, BUTTON_SECONDARY, statusBadge } from "@/lib/ui";

const BROWSE_TABS: { value: BrowseSort; label: string; icon: string }[] = [
  { value: "trending", label: "Trending Now", icon: "🔥" },
  { value: "popular", label: "All-Time Popular", icon: "⭐" },
  { value: "top-rated", label: "Top Rated", icon: "🏆" },
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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

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
    if (browseCache[browseKey]) return;

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
    const targetId = manga.anilistId;

    setConfirmingAdd(true);
    setAddedIds((prev) => new Set(prev).add(targetId));

    try {
      const saved = await addMangaToLibrary(manga);

      if (selectedCategoryId && saved?.id) {
        await setMangaCategory(saved.id, selectedCategoryId, false);
      }
      setToastMessage({
        text: `Added "${manga.title}" to your library!`,
        type: "success",
      });
    } catch {
      setAddedIds((prev) => toggleSetItem(prev, targetId));
      setToastMessage({
        text: "Failed to add manga to library.",
        type: "error",
      });
    } finally {
      setConfirmingAdd(false);
      setPendingManga(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      <AmbientBackground
        primary="-top-20 right-1/3 h-[500px] w-[500px] blur-[150px]"
        secondary="-bottom-32 left-1/4 h-[450px] w-[450px] blur-[120px]"
      />

      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <PageHeader
          eyebrow="Discover"
          title="Search & Browse AniList"
          description="Explore trending manga, popular classics, and top-rated masterworks. Add anything you want to track to your personal library."
        />

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="animate-fade-in-up mb-8 flex gap-3" style={{ animationDelay: "0.08s" }}>
          <div className="group relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title (e.g. Chainsaw Man, Monster, Vinland Saga)..."
              className="w-full rounded-2xl border border-[#1E2C42] bg-[#0F1B2E]/90 px-5 py-3.5 pl-12 pr-10 text-sm text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none backdrop-blur-md transition-all duration-300 focus:border-[#E8C77E]/60 focus:shadow-[0_0_30px_rgba(232,199,126,0.15)]"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8CA0BE] transition-colors duration-300 group-focus-within:text-[#E8C77E]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setHasSearched(false);
                  setResults([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8CA0BE] hover:text-white"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={cn(BUTTON_PRIMARY, "px-7 py-3.5 text-xs font-bold shrink-0")}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <ErrorBanner className="animate-fade-in-up mb-8 shadow-xl">
            <span className="font-semibold">Error:</span> {error}
          </ErrorBanner>
        )}

        {loading && <MangaCardSkeletons count={10} />}

        {/* Browse Section */}
        {!hasSearched && !error && (
          <div className="animate-fade-in-up">
            {/* Browse Tabs */}
            <div className="mb-4 flex flex-wrap gap-2 border-b border-[#1E2C42]/80 pb-4">
              {BROWSE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setBrowseTab(tab.value)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                    browseTab === tab.value
                      ? "bg-[#E8C77E] font-bold text-[#0B1220] shadow-[0_0_20px_rgba(232,199,126,0.3)]"
                      : "border border-[#1E2C42] bg-[#0F1B2E]/60 text-[#8CA0BE] hover:border-[#E8C77E]/40 hover:text-[#F5F5F0]"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Genre Filter Pills */}
            <div className="mb-8 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase text-[#8CA0BE] mr-1">
                Genre:
              </span>
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
              <MangaCardSkeletons count={10} />
            ) : browseResults && browseResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
                {browseResults.map((manga, i) => {
                  const mId = manga.anilistId;
                  return (
                    <MangaPosterCard
                      key={mId}
                      manga={manga}
                      index={i}
                      isAdded={addedIds.has(mId)}
                      onAdd={openAddModal}
                    />
                  );
                })}
              </div>
            ) : (
              !browseError && (
                <EmptyState>
                  <p className="text-sm text-[#8CA0BE]">
                    No manga found for this genre. Try selecting "All".
                  </p>
                </EmptyState>
              )
            )}
          </div>
        )}

        {/* Search Empty State */}
        {hasSearched && !loading && !error && results.length === 0 && (
          <EmptyState>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1E2C42] bg-[#0F1B2E] text-2xl">
              🔍
            </div>
            <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl font-bold text-[#F5F5F0]">
              No results found
            </h3>
            <p className="mb-4 text-sm text-[#8CA0BE]">
              We couldn't find any manga matching "{query}".
            </p>
            <button
              onClick={() => {
                setQuery("");
                setHasSearched(false);
              }}
              className={cn(BUTTON_SECONDARY, "px-5 py-2 text-xs")}
            >
              Back to Browse
            </button>
          </EmptyState>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <ResultsHeader>
                Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
              </ResultsHeader>
              <button
                onClick={() => {
                  setQuery("");
                  setHasSearched(false);
                  setResults([]);
                }}
                className="font-mono text-xs text-[#E8C77E] hover:underline"
              >
                ← Back to Browse
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
              {results.map((manga, i) => {
                const mId = manga.anilistId;
                return (
                  <MangaPosterCard
                    key={mId}
                    manga={manga}
                    index={i}
                    isAdded={addedIds.has(mId)}
                    onAdd={openAddModal}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Category picker modal when adding to library */}
      {pendingManga && (
        <Modal title="Add to Library">
          <div className="mt-2">
            <p className="mb-4 text-sm leading-relaxed text-[#8CA0BE]">
              Adding <span className="font-semibold text-[#F5F5F0]">{pendingManga.title}</span>.
              {categories.length > 0 ? " Assign a category tag, or add directly:" : ""}
            </p>

            {categories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <TogglePill
                  active={selectedCategoryId === null}
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-xs"
                >
                  No Tag
                </TogglePill>
                {categories.map((cat) => (
                  <TogglePill
                    key={cat.id}
                    active={selectedCategoryId === cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    accent="gold"
                    className="text-xs"
                  >
                    🏷️ {cat.name}
                  </TogglePill>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPendingManga(null)}
                disabled={confirmingAdd}
                className={cn(BUTTON_SECONDARY, "flex-1 py-2.5 text-xs")}
              >
                Cancel
              </button>
              <button
                onClick={confirmAdd}
                disabled={confirmingAdd}
                className={cn(BUTTON_PRIMARY, "flex-1 py-2.5 text-xs font-bold")}
              >
                {confirmingAdd ? "Adding..." : "+ Save to Library"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MangaPosterCard({
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
  const statusInfo = statusBadge(manga.status);
  const mangafireUrl = `https://mangafire.to/browse?keyword=${encodeURIComponent(manga.title)}&sort=relevance:desc`;

  return (
    <div
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
      className="animate-fade-in-up group flex flex-col overflow-hidden rounded-2xl border border-[#1E2C42] bg-[#0F1B2E]/90 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#E8C77E]/60 hover:shadow-[0_15px_35px_rgba(232,199,126,0.18)]"
    >
      {/* 2:3 Cover Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0B1220]">
        <CoverImage
          src={manga.coverUrl}
          alt={manga.title}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F1B2E] via-transparent to-black/40" />

        {/* Status tag */}
        <div className="absolute left-2 top-2">
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Score badge */}
        {manga.score !== null && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-[#E8C77E]/40 bg-[#0B1220]/80 px-2 py-0.5 font-mono text-[10px] font-bold text-[#E8C77E] backdrop-blur-md">
            <span>⭐</span>
            <span>{manga.score}</span>
          </div>
        )}

        {/* MangaFire Reader quick button */}
        <a
          href={mangafireUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Read on MangaFire"
          className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full border border-red-500/40 bg-[#0B1220]/85 text-xs text-red-300 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
          🔥
        </a>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-sm font-bold text-[#F5F5F0] transition-colors group-hover:text-[#E8C77E]">
            {manga.title}
          </h3>

          {/* Genres */}
          {manga.genres.length > 0 && (
            <p className="mt-1 line-clamp-1 font-mono text-[10px] text-[#8CA0BE]">
              {manga.genres.slice(0, 2).join(" · ")}
            </p>
          )}
        </div>

        {/* Add button */}
        <div className="mt-3 pt-2 border-t border-[#1E2C42]/60">
          <button
            onClick={() => onAdd(manga)}
            disabled={isAdded}
            className={`w-full rounded-full py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              isAdded
                ? "border border-[#1E2C42] bg-[#1E2C42]/30 text-[#8CA0BE]"
                : "border border-[#E8C77E] bg-[#E8C77E] text-[#0B1220] hover:bg-[#F5F5F0] hover:border-[#F5F5F0] hover:shadow-[0_0_15px_rgba(232,199,126,0.3)] active:scale-95"
            }`}
          >
            {isAdded ? "✓ In Library" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
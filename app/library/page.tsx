"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, requestJson } from "@/lib/http";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface SavedManga {
  id: number;
  malId: number;
  title: string;
  genres: string;
  coverUrl: string | null;
  synopsis: string | null;
  publicationStatus: string | null;
  readingStatus: string;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  publishedFrom: string | null;
  categories: Category[];
  siteUrl: string | null;
}

type SortOption =
  | "recently-added"
  | "year-newest"
  | "year-oldest"
  | "highest-rated"
  | "latest-update";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recently-added", label: "Recently Added" },
  { value: "year-newest", label: "Year (Newest)" },
  { value: "year-oldest", label: "Year (Oldest)" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "latest-update", label: "Latest Update" },
];

export default function LibraryPage() {
  const router = useRouter();
  const [manga, setManga] = useState<SavedManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recently-added");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [managingCategories, setManagingCategories] = useState(false);
  const [allCategoryObjs, setAllCategoryObjs] = useState<Category[]>([]);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Remove this manga from your library?")) return;

    setDeletingId(id);
    try {
      await requestJson(`/api/manga/${id}`, { method: "DELETE" });
      setManga((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${errorMessage(err)}`);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    async function loadLibrary() {
      try {
        const data = await requestJson<{ manga?: SavedManga[] }>(
          "/api/manga/list"
        );
        setManga(data.manga ?? []);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await requestJson<{ categories?: Category[] }>(
        "/api/categories"
      );
      setAllCategoryObjs(data.categories ?? []);
    } catch (err) {
      // Non-critical — category chips on cards still work without this list,
      // so this doesn't block the page, but it is logged rather than dropped.
      console.error("Failed to load categories:", err);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Delete this category? It will be removed from all manga.")) return;

    setDeletingCategoryId(id);
    try {
      await requestJson(`/api/categories/${id}`, { method: "DELETE" });
      setAllCategoryObjs((prev) => prev.filter((c) => c.id !== id));
      setManga((prev) =>
        prev.map((m) => ({
          ...m,
          categories: m.categories.filter((c) => c.id !== id),
        }))
      );
      if (categoryFilter === allCategoryObjs.find((c) => c.id === id)?.name) {
        setCategoryFilter("All");
      }
    } catch (err) {
      alert(`Failed to delete category: ${errorMessage(err)}`);
    } finally {
      setDeletingCategoryId(null);
    }
  }

  const allGenres = Array.from(
    new Set(manga.flatMap((m) => parseList(m.genres)))
  ).sort();

  const allCategories = Array.from(
    new Map(
      manga.flatMap((m) => m.categories).map((c) => [c.id, c.name])
    ).values()
  ).sort();

  const filtered = manga
    .filter((m) =>
      genreFilter === "All" ? true : m.genres.split(",").includes(genreFilter)
    )
    .filter((m) =>
      categoryFilter === "All"
        ? true
        : m.categories.some((c) => c.name === categoryFilter)
    )
    .filter((m) =>
      searchQuery.trim() === ""
        ? true
        : m.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "year-newest":
          return (b.publishedFrom ?? "").localeCompare(a.publishedFrom ?? "");
        case "year-oldest":
          // Empty/unknown dates sort last regardless of direction
          if (!a.publishedFrom) return 1;
          if (!b.publishedFrom) return -1;
          return a.publishedFrom.localeCompare(b.publishedFrom);
        case "highest-rated":
          return (b.rating ?? -1) - (a.rating ?? -1);
        case "latest-update":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "recently-added":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-[#F5F5F0]">
      <AmbientBackground
        primary="-top-32 left-1/3 h-[450px] w-[450px] blur-[130px]"
        secondary="-bottom-40 right-1/4 h-[400px] w-[400px] blur-[100px]"
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <PageHeader
          eyebrow="Library"
          title="Your collection"
          description={`${manga.length} manga saved`}
        />

        {/* Search bar with icon and glass effect */}
        <div className="animate-fade-in-up mb-8" style={{ animationDelay: "0.05s" }}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library by title..."
              className="w-full rounded-full border border-[#1E2C42] bg-[#0F1B2E]/80 px-5 py-3.5 pl-12 text-sm text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none backdrop-blur-sm transition-all duration-300 focus:border-[#E8C77E]/50 focus:shadow-[0_0_25px_rgba(232,199,126,0.15)]"
            />
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8CA0BE]"
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
        </div>

        {/* Genre filter */}
        {allGenres.length > 0 && (
          <div className="animate-fade-in-up mb-3 flex flex-wrap gap-2" style={{ animationDelay: "0.1s" }}>
            {["All", ...allGenres].map((genre) => (
              <TogglePill
                key={genre}
                active={genreFilter === genre}
                onClick={() => setGenreFilter(genre)}
              >
                {genre}
              </TogglePill>
            ))}
          </div>
        )}

        {/* Category filter */}
        {allCategories.length > 0 && (
          <div className="animate-fade-in-up mb-10 flex flex-wrap gap-2" style={{ animationDelay: "0.15s" }}>
            {["All", ...allCategories].map((cat) => (
              <TogglePill
                key={cat}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
                accent="gold"
              >
                {cat}
              </TogglePill>
            ))}
          </div>
        )}

        {loading && <MangaCardSkeletons className="mb-10" />}

        {error && <ErrorBanner className="mb-8">{error}</ErrorBanner>}

        {/* Empty state */}
        {!loading && !error && manga.length === 0 && (
          <EmptyState>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#1E2C42] bg-[#0F1B2E]">
              <svg className="h-8 w-8 text-[#E8C77E]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="mb-4 text-sm text-[#8CA0BE]">
              Your library is empty. Search for manga and add what you're reading.
            </p>
            <a
              href="/search"
              className={cn(BUTTON_PRIMARY, "inline-block px-6 py-3")}
            >
              Go to Search
            </a>
          </EmptyState>
        )}

        {/* Control bar: sort, view toggle, manage categories */}
        {!loading && !error && manga.length > 0 && (
          <div className="animate-fade-in-up mb-6 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: "0.18s" }}>
            <div className="flex items-center gap-2">
              <span className={LABEL}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-full border border-[#1E2C42] bg-[#0F1B2E] px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide text-[#F5F5F0] outline-none transition-all duration-200 focus:border-[#E8C77E]/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {allCategoryObjs.length > 0 && (
                <TogglePill
                  active={false}
                  onClick={() => setManagingCategories(true)}
                >
                  Manage Categories
                </TogglePill>
              )}
              <div className="flex overflow-hidden rounded-full border border-[#1E2C42]">
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wide capitalize transition-all duration-200 ${
                      viewMode === mode
                        ? "bg-[#F5F5F0] text-[#0B1220]"
                        : "text-[#8CA0BE] hover:text-[#F5F5F0]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results grid/list */}
        {!loading && !error && manga.length > 0 && (
          <>
            <ResultsHeader style={{ animationDelay: "0.2s" }}>
              {filtered.length} manga
            </ResultsHeader>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m, i) => (
                  <div
                    key={m.id}
                    onClick={() => router.push(`/library/${m.id}`)}
                    style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
                    className="animate-fade-in-up group flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#E8C77E]/40 hover:shadow-[0_10px_40px_rgba(232,199,126,0.15)]"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0B1220]">
                      <CoverImage
                        src={m.coverUrl}
                        alt={m.title}
                        imgClassName="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-transparent to-transparent" />
                      {/* Shimmer sweep on hover */}
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      {/* Reading status badge */}
                      <span className="absolute right-2 top-2 rounded-full border border-[#E8C77E]/40 bg-[#0B1220]/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E] backdrop-blur-sm">
                        {m.readingStatus}
                      </span>

                      {/* Rating badge */}
                      {m.rating !== null && (
                        <span className="absolute bottom-2 right-2 rounded-full border border-[#E8C77E]/40 bg-[#0B1220]/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-[#E8C77E] backdrop-blur-sm">
                          ★ {m.rating}/10
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, m.id)}
                        disabled={deletingId === m.id}
                        className={cn(
                          BUTTON_DANGER,
                          "absolute left-2 top-2 bg-[#0B1220]/90 px-2.5 py-1 backdrop-blur-sm"
                        )}
                      >
                        {deletingId === m.id ? "..." : "✕"}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="font-[family-name:var(--font-display)] text-base font-semibold leading-snug">
                        {m.title}
                      </h3>

                      {/* Genres */}
                      {m.genres && (
                        <div className="flex flex-wrap gap-1.5">
                          {parseList(m.genres)
                            .slice(0, 3)
                            .map((genre) => (
                              <Chip key={genre}>{genre}</Chip>
                            ))}
                        </div>
                      )}

                      {/* Categories */}
                      {m.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.categories.map((cat) => (
                            <Chip key={cat.id} accent="light">
                              {cat.name}
                            </Chip>
                          ))}
                        </div>
                      )}

                      {m.siteUrl && (
                        <a
                          href={m.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-auto inline-block font-mono text-[10px] uppercase tracking-wide text-[#E8C77E] transition-all duration-200 hover:underline hover:underline-offset-4"
                        >
                          View Full Details ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((m, i) => (
                  <div
                    key={m.id}
                    onClick={() => router.push(`/library/${m.id}`)}
                    style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                    className="animate-fade-in-up group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-[#1E2C42] bg-[#0F1B2E] p-3 transition-all duration-200 hover:border-[#E8C77E]/40"
                  >
                    <div className="relative aspect-[2/3] w-12 flex-shrink-0 self-start overflow-hidden rounded-md bg-[#0B1220]">
                      <CoverImage
                        src={m.coverUrl}
                        alt={m.title}
                        fallback={
                          <div className="flex h-full items-center justify-center text-[8px] text-[#8CA0BE]">
                            N/A
                          </div>
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-[family-name:var(--font-display)] text-sm font-semibold">
                        {m.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-[#8CA0BE]">
                        <span>{m.readingStatus}</span>
                        {m.rating !== null && (
                          <span className="text-[#E8C77E]">★ {m.rating}/10</span>
                        )}
                        {m.categories.slice(0, 2).map((cat) => (
                          <span key={cat.id}>{cat.name}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, m.id)}
                      disabled={deletingId === m.id}
                      className={cn(BUTTON_DANGER, "flex-shrink-0 px-2.5 py-1")}
                    >
                      {deletingId === m.id ? "..." : "✕"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Manage categories modal */}
      {managingCategories && (
        <Modal title="Manage Categories">
          <div className="mt-2">
            <div className="mb-6 flex max-h-64 flex-col gap-2 overflow-y-auto">
              {allCategoryObjs.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-[#1E2C42] px-3 py-2"
                >
                  <span className="text-sm text-[#F5F5F0]">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={deletingCategoryId === cat.id}
                    className={cn(BUTTON_DANGER, "px-2.5 py-1")}
                  >
                    {deletingCategoryId === cat.id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
              {allCategoryObjs.length === 0 && (
                <p className="text-sm text-[#8CA0BE]">No categories left.</p>
              )}
            </div>
            <button
              onClick={() => setManagingCategories(false)}
              className={cn(BUTTON_SECONDARY, "w-full px-4 py-2.5")}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AmbientBackground from "@/components/AmbientBackground";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import CoverImage from "@/components/CoverImage";
import Chip from "@/components/Chip";
import MangaCardSkeletons from "@/components/MangaCardSkeletons";
import {
  deleteCategory,
  deleteManga,
  exportLibrary,
  fetchCategories,
  fetchLibrary,
  importLibrary,
  type ImportResult,
} from "@/lib/api-client";
import { parseList } from "@/lib/manga";
import type { Category, SavedManga } from "@/lib/types";
import {
  cn,
  BUTTON_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  LABEL,
  statusBadge,
} from "@/lib/ui";

type SortOption =
  | "recently-added"
  | "title-az"
  | "highest-rated"
  | "year-newest"
  | "year-oldest"
  | "latest-update";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recently-added", label: "Recently Added" },
  { value: "title-az", label: "Title (A-Z)" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "year-newest", label: "Year (Newest)" },
  { value: "year-oldest", label: "Year (Oldest)" },
  { value: "latest-update", label: "Recently Updated" },
];

export default function LibraryPage() {
  const router = useRouter();
  const [manga, setManga] = useState<SavedManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [genreFilter, setGenreFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recently-added");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals & Feedback
  const [managingCategories, setManagingCategories] = useState(false);
  const [allCategoryObjs, setAllCategoryObjs] = useState<Category[]>([]);
  const [deletingMangaItem, setDeletingMangaItem] = useState<{ id: number; title: string } | null>(null);
  const [deletingCategoryItem, setDeletingCategoryItem] = useState<Category | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Export / Import state
  const [exporting, setExporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonData, setImportJsonData] = useState<{ library?: unknown[]; categories?: unknown[] } | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLibrary() {
      try {
        setManga(await fetchLibrary());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setAllCategoryObjs(await fetchCategories());
    } catch {
      // non-critical
    }
  }

  async function confirmDeleteManga() {
    if (!deletingMangaItem) return;
    const { id, title } = deletingMangaItem;
    setDeletingMangaItem(null);

    try {
      await deleteManga(id);
      setManga((prev) => prev.filter((m) => m.id !== id));
      setToastMessage({ text: `Removed "${title}" from your library`, type: "info" });
    } catch {
      setToastMessage({ text: "Failed to remove manga.", type: "error" });
    }
  }

  async function confirmDeleteCategory() {
    if (!deletingCategoryItem) return;
    const { id, name } = deletingCategoryItem;
    setDeletingCategoryItem(null);

    try {
      await deleteCategory(id);
      setAllCategoryObjs((prev) => prev.filter((c) => c.id !== id));
      setManga((prev) =>
        prev.map((m) => ({
          ...m,
          categories: m.categories.filter((c) => c.id !== id),
        }))
      );
      if (categoryFilter === name) {
        setCategoryFilter("All");
      }
      setToastMessage({ text: `Deleted category "${name}"`, type: "info" });
    } catch {
      setToastMessage({ text: "Failed to delete category.", type: "error" });
    }
  }

  async function handleExportLibrary() {
    setExporting(true);
    try {
      await exportLibrary();
      setToastMessage({
        text: "Library backup exported successfully!",
        type: "success",
      });
    } catch (err) {
      setToastMessage({
        text: err instanceof Error ? err.message : "Failed to export library",
        type: "error",
      });
    } finally {
      setExporting(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.library)) {
          throw new Error("Invalid backup file. Expected a 'library' array.");
        }
        setImportJsonData(parsed);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to parse JSON file");
        setImportJsonData(null);
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
      setImportJsonData(null);
    };
    reader.readAsText(file);
  }

  async function handleExecuteImport() {
    if (!importJsonData) return;
    setImporting(true);
    setImportError(null);

    try {
      const result = await importLibrary(importJsonData, importMode);
      setManga(await fetchLibrary());
      await loadCategories();
      setImportModalOpen(false);
      setImportJsonData(null);
      setImportFileName(null);
      setToastMessage({
        text: `Restored: ${result.importedCount} added, ${result.updatedCount} updated!`,
        type: "success",
      });
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to import library."
      );
    } finally {
      setImporting(false);
    }
  }

  // Aggregate genres with item counts
  const genreCounts = manga.reduce<Record<string, number>>((acc, m) => {
    parseList(m.genres).forEach((g) => {
      acc[g] = (acc[g] || 0) + 1;
    });
    return acc;
  }, {});

  const allGenres = Object.keys(genreCounts).sort();

  // Aggregate categories with item counts
  const categoryCounts = manga.reduce<Record<string, number>>((acc, m) => {
    m.categories.forEach((c) => {
      acc[c.name] = (acc[c.name] || 0) + 1;
    });
    return acc;
  }, {});

  const allCategories = Object.keys(categoryCounts).sort();

  // Status counts
  const statusCounts = {
    All: manga.length,
    reading: manga.filter((m) => m.readingStatus === "reading").length,
    planning: manga.filter((m) => m.readingStatus === "planning").length,
    completed: manga.filter((m) => m.readingStatus === "completed").length,
  };

  const hasActiveFilters =
    statusFilter !== "All" ||
    genreFilter !== "All" ||
    categoryFilter !== "All" ||
    searchQuery.trim() !== "";

  const filtered = manga
    .filter((m) => {
      if (statusFilter === "All") return true;
      return m.readingStatus === statusFilter.toLowerCase();
    })
    .filter((m) =>
      genreFilter === "All" ? true : parseList(m.genres).includes(genreFilter)
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
        case "title-az":
          return a.title.localeCompare(b.title);
        case "year-newest":
          return (b.publishedFrom ?? "").localeCompare(a.publishedFrom ?? "");
        case "year-oldest":
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
        primary="-top-32 left-1/3 h-[500px] w-[500px] blur-[150px]"
        secondary="-bottom-40 right-1/4 h-[450px] w-[450px] blur-[120px]"
      />

      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <ConfirmModal
        isOpen={deletingMangaItem !== null}
        title="Remove from Library?"
        message={`Are you sure you want to remove "${deletingMangaItem?.title}" from your library?`}
        confirmLabel="Remove Manga"
        onConfirm={confirmDeleteManga}
        onCancel={() => setDeletingMangaItem(null)}
      />

      <ConfirmModal
        isOpen={deletingCategoryItem !== null}
        title="Delete Category Tag?"
        message={`Delete category "${deletingCategoryItem?.name}"? It will be untagged from all manga.`}
        confirmLabel="Delete Tag"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeletingCategoryItem(null)}
      />

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2C42]/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8C77E]">
                Collection
              </span>
              <span className="text-[#1E2C42]">/</span>
              <span className="font-mono text-xs uppercase text-[#8CA0BE]">
                {manga.length} titles
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#F5F5F0]">
              My Library
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className={cn(BUTTON_PRIMARY, "px-5 py-2.5 text-xs font-bold")}
            >
              <span>+ Add Manga</span>
            </Link>
            <Link
              href="/recommendations"
              className={cn(BUTTON_SECONDARY, "px-5 py-2.5 text-xs")}
            >
              <span>AI Recommendations ✨</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Desktop Layout: Left Sidebar + Main Poster Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT STICKY FILTER SIDEBAR */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-20 shrink-0 space-y-6 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/85 p-5 shadow-xl backdrop-blur-xl">
            {/* Search within library */}
            <div>
              <p className={`mb-2 ${LABEL}`}>Filter Title</p>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collection..."
                  className="w-full rounded-xl border border-[#1E2C42] bg-[#0B1220]/80 px-3.5 py-2.5 pl-9 text-xs text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none transition-all focus:border-[#E8C77E]/60"
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8CA0BE]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8CA0BE] hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Reading Status Filter */}
            <div>
              <p className={`mb-2 ${LABEL}`}>Reading Status</p>
              <div className="flex flex-col gap-1">
                {[
                  { id: "All", label: "All Manga", count: statusCounts.All },
                  { id: "reading", label: "Reading", count: statusCounts.reading, dot: "bg-blue-400" },
                  { id: "planning", label: "Planning", count: statusCounts.planning, dot: "bg-amber-400" },
                  { id: "completed", label: "Completed", count: statusCounts.completed, dot: "bg-emerald-400" },
                ].map((s) => {
                  const active = statusFilter.toLowerCase() === s.id.toLowerCase();
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-mono transition-all ${
                        active
                          ? "bg-[#E8C77E] font-bold text-[#0B1220] shadow-[0_0_15px_rgba(232,199,126,0.3)]"
                          : "text-[#8CA0BE] hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {s.dot && <span className={`h-2 w-2 rounded-full ${s.dot}`} />}
                        <span>{s.label}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          active
                            ? "bg-[#0B1220]/20 text-[#0B1220]"
                            : "bg-[#0B1220]/60 text-[#8CA0BE]"
                        }`}
                      >
                        {s.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Tags Filter */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className={LABEL}>Category Tags</p>
                {allCategoryObjs.length > 0 && (
                  <button
                    onClick={() => setManagingCategories(true)}
                    className="font-mono text-[10px] text-[#E8C77E] hover:underline"
                  >
                    ⚙️ Edit
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setCategoryFilter("All")}
                  className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-mono transition-all ${
                    categoryFilter === "All"
                      ? "bg-[#E8C77E] font-bold text-[#0B1220]"
                      : "text-[#8CA0BE] hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0]"
                  }`}
                >
                  <span>All Tags</span>
                  <span className="text-[10px] opacity-70">{manga.length}</span>
                </button>
                {allCategories.map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-mono transition-all ${
                        active
                          ? "bg-blue-500 font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                          : "text-[#8CA0BE] hover:bg-[#1E2C42]/50 hover:text-blue-300"
                      }`}
                    >
                      <span className="truncate">🏷️ {cat}</span>
                      <span className="text-[10px] opacity-70">
                        {categoryCounts[cat]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genres Filter (Scrollable Vertical) */}
            {allGenres.length > 0 && (
              <div>
                <p className={`mb-2 ${LABEL}`}>Genres</p>
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                  <button
                    onClick={() => setGenreFilter("All")}
                    className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-mono transition-all ${
                      genreFilter === "All"
                        ? "bg-[#E8C77E] font-bold text-[#0B1220]"
                        : "text-[#8CA0BE] hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0]"
                    }`}
                  >
                    <span>All Genres</span>
                    <span className="text-[10px] opacity-70">{manga.length}</span>
                  </button>
                  {allGenres.map((genre) => {
                    const active = genreFilter === genre;
                    return (
                      <button
                        key={genre}
                        onClick={() => setGenreFilter(genre)}
                        className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-mono transition-all ${
                          active
                            ? "bg-[#E8C77E]/20 font-bold text-[#E8C77E] border border-[#E8C77E]/40"
                            : "text-[#8CA0BE] hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0]"
                        }`}
                      >
                        <span className="truncate">{genre}</span>
                        <span className="text-[10px] opacity-70">
                          {genreCounts[genre]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setGenreFilter("All");
                  setCategoryFilter("All");
                  setSearchQuery("");
                }}
                className="w-full rounded-xl border border-[#1E2C42] bg-[#0B1220]/60 py-2 font-mono text-xs uppercase tracking-wider text-[#E8C77E] hover:bg-[#E8C77E] hover:text-[#0B1220] transition-all"
              >
                Reset All Filters
              </button>
            )}

            {/* Backup & Restore */}
            <div className="border-t border-[#1E2C42]/80 pt-4">
              <p className={`mb-2.5 ${LABEL}`}>Backup & Restore</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleExportLibrary}
                  disabled={exporting || manga.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#1E2C42] bg-[#0B1220]/60 py-2 font-mono text-xs text-[#8CA0BE] hover:border-[#E8C77E]/50 hover:text-[#E8C77E] transition-all disabled:opacity-50"
                >
                  <span>📥</span>
                  <span>{exporting ? "Exporting..." : "Export Library (JSON)"}</span>
                </button>
                <button
                  onClick={() => {
                    setImportError(null);
                    setImportJsonData(null);
                    setImportFileName(null);
                    setImportModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#1E2C42] bg-[#0B1220]/60 py-2 font-mono text-xs text-[#8CA0BE] hover:border-[#E8C77E]/50 hover:text-[#E8C77E] transition-all"
                >
                  <span>📤</span>
                  <span>Import Backup</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN POSTER GRID / LIST AREA */}
          <main className="flex-1 w-full min-w-0">
            {/* Controls bar: Results count, Sort by, Grid/List view */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1E2C42]/80 bg-[#0F1B2E]/60 p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 font-mono text-xs text-[#8CA0BE]">
                <span className="font-semibold text-[#F5F5F0]">{filtered.length}</span>
                <span>matching titles</span>
                {hasActiveFilters && (
                  <span className="text-[10px] text-[#E8C77E]">(filtered)</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className={LABEL}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="rounded-xl border border-[#1E2C42] bg-[#0B1220] px-3 py-1.5 text-xs text-[#F5F5F0] outline-none focus:border-[#E8C77E]/50"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0F1B2E]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid / List Switcher */}
                <div className="flex rounded-xl border border-[#1E2C42] bg-[#0B1220] p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Poster Grid"
                    className={`rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                      viewMode === "grid"
                        ? "bg-[#E8C77E] text-[#0B1220]"
                        : "text-[#8CA0BE] hover:text-white"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    title="List View"
                    className={`rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                      viewMode === "list"
                        ? "bg-[#E8C77E] text-[#0B1220]"
                        : "text-[#8CA0BE] hover:text-white"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {loading && <MangaCardSkeletons count={10} />}

            {error && <ErrorBanner className="mb-8">{error}</ErrorBanner>}

            {/* Empty Library */}
            {!loading && !error && manga.length === 0 && (
              <EmptyState>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E8C77E]/30 bg-[#E8C77E]/10 text-2xl">
                  📚
                </div>
                <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl font-bold text-[#F5F5F0]">
                  Your Library is Empty
                </h3>
                <p className="mb-6 mx-auto max-w-sm text-sm text-[#8CA0BE]">
                  Add manga from search or use the AI recommender to start tracking what you read.
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/search" className={cn(BUTTON_PRIMARY, "px-6 py-2.5 text-xs")}>
                    Search AniList
                  </Link>
                  <Link href="/recommendations" className={cn(BUTTON_SECONDARY, "px-6 py-2.5 text-xs")}>
                    AI Recommendations
                  </Link>
                </div>
              </EmptyState>
            )}

            {/* Filtered Empty State */}
            {!loading && !error && manga.length > 0 && filtered.length === 0 && (
              <EmptyState>
                <p className="text-sm text-[#8CA0BE] mb-4">
                  No manga match your active filter selections.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter("All");
                    setGenreFilter("All");
                    setCategoryFilter("All");
                    setSearchQuery("");
                  }}
                  className={cn(BUTTON_SECONDARY, "px-5 py-2 text-xs")}
                >
                  Clear Filters
                </button>
              </EmptyState>
            )}

            {/* High-Density Poster Grid (4-5 columns) */}
            {!loading && !error && filtered.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((m, i) => {
                  const statusInfo = statusBadge(m.readingStatus);
                  const genres = parseList(m.genres);

                  return (
                    <div
                      key={m.id}
                      onClick={() => router.push(`/library/${m.id}`)}
                      style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
                      className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-[#1E2C42] bg-[#0F1B2E]/90 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#E8C77E]/60 hover:shadow-[0_15px_35px_rgba(232,199,126,0.18)] cursor-pointer"
                    >
                      {/* Vertical 2:3 Cover Poster */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0B1220]">
                        <CoverImage
                          src={m.coverUrl}
                          alt={m.title}
                          imgClassName="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F1B2E] via-transparent to-black/40" />

                        {/* Status Chip (Top-Left) */}
                        <div className="absolute left-2 top-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Rating (Top-Right) */}
                        {m.rating !== null && (
                          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-[#E8C77E]/40 bg-[#0B1220]/80 px-2 py-0.5 font-mono text-[10px] font-bold text-[#E8C77E] backdrop-blur-md">
                            <span>⭐</span>
                            <span>{m.rating}</span>
                          </div>
                        )}

                        {/* Quick Delete button on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingMangaItem({ id: m.id, title: m.title });
                          }}
                          title="Remove from library"
                          className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded-full border border-red-500/40 bg-[#0B1220]/80 text-[10px] text-red-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Poster Card Details */}
                      <div className="flex flex-1 flex-col justify-between p-3.5">
                        <div>
                          <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-sm font-bold text-[#F5F5F0] transition-colors group-hover:text-[#E8C77E]">
                            {m.title}
                          </h3>

                          {/* Genres */}
                          {genres.length > 0 && (
                            <p className="mt-1 line-clamp-1 font-mono text-[10px] text-[#8CA0BE]">
                              {genres.slice(0, 2).join(" · ")}
                            </p>
                          )}

                          {/* Custom Category Tags */}
                          {m.categories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {m.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat.id}
                                  className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.2 font-mono text-[8px] uppercase text-blue-300"
                                >
                                  #{cat.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compact List View */}
            {!loading && !error && filtered.length > 0 && viewMode === "list" && (
              <div className="flex flex-col gap-2">
                {filtered.map((m, i) => {
                  const statusInfo = statusBadge(m.readingStatus);

                  return (
                    <div
                      key={m.id}
                      onClick={() => router.push(`/library/${m.id}`)}
                      style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                      className="animate-fade-in-up group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#1E2C42] bg-[#0F1B2E]/70 p-3 shadow-md backdrop-blur-md transition-all hover:border-[#E8C77E]/50 hover:bg-[#0F1B2E]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#0B1220]">
                          <CoverImage src={m.coverUrl} alt={m.title} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-[family-name:var(--font-display)] text-sm font-bold text-[#F5F5F0] group-hover:text-[#E8C77E]">
                            {m.title}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`rounded-full border px-2 py-0.2 font-mono text-[8px] uppercase ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                            {m.rating !== null && (
                              <span className="font-mono text-[10px] font-bold text-[#E8C77E]">
                                ⭐ {m.rating}/10
                              </span>
                            )}
                            {m.categories.map((c) => (
                              <span key={c.id} className="font-mono text-[9px] text-blue-300">
                                #{c.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingMangaItem({ id: m.id, title: m.title });
                        }}
                        className="rounded-full p-2 text-[#8CA0BE] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Manage Categories Modal */}
      {managingCategories && (
        <Modal title="Manage Custom Category Tags">
          <div className="mt-4">
            <div className="mb-6 flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
              {allCategoryObjs.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-[#1E2C42] bg-[#0B1220]/60 px-3.5 py-2.5"
                >
                  <span className="font-medium text-sm text-[#F5F5F0] flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E8C77E]" />
                    {cat.name}
                  </span>
                  <button
                    onClick={() => setDeletingCategoryItem(cat)}
                    className={cn(BUTTON_DANGER, "px-3 py-1")}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {allCategoryObjs.length === 0 && (
                <p className="text-sm text-[#8CA0BE] text-center py-4">No categories created yet.</p>
              )}
            </div>
            <button
              onClick={() => setManagingCategories(false)}
              className={cn(BUTTON_SECONDARY, "w-full py-2.5 text-xs")}
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Import Library Modal */}
      {importModalOpen && (
        <Modal title="Import Library Backup">
          <div className="mt-4 space-y-5">
            <p className="text-xs text-[#8CA0BE] leading-relaxed">
              Upload a previously exported <code className="text-[#E8C77E]">.json</code> backup file to restore your manga collection, ratings, reading status, and category tags.
            </p>

            {/* File Input */}
            <div className="rounded-2xl border-2 border-dashed border-[#1E2C42] bg-[#0B1220]/60 p-5 text-center">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                id="library-backup-file"
                className="hidden"
              />
              <label
                htmlFor="library-backup-file"
                className="cursor-pointer flex flex-col items-center gap-2 text-xs text-[#8CA0BE] hover:text-[#F5F5F0]"
              >
                <span className="text-2xl">📁</span>
                <span className="font-medium text-[#E8C77E]">
                  {importFileName ? importFileName : "Click to select .json file"}
                </span>
                <span className="text-[10px] text-[#8CA0BE]">JSON backup files only</span>
              </label>
            </div>

            {/* Detected Stats */}
            {importJsonData && (
              <div className="rounded-2xl border border-[#E8C77E]/30 bg-[#E8C77E]/10 p-4">
                <p className="font-mono text-xs font-bold text-[#E8C77E] mb-1">
                  ✓ Backup File Validated
                </p>
                <div className="flex gap-4 font-mono text-[11px] text-[#F5F5F0]">
                  <span>📚 {Array.isArray(importJsonData.library) ? importJsonData.library.length : 0} Manga Titles</span>
                  <span>🏷️ {Array.isArray(importJsonData.categories) ? importJsonData.categories.length : 0} Categories</span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {importError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {importError}
              </div>
            )}

            {/* Import Strategy Mode */}
            {importJsonData && (
              <div>
                <p className={`mb-2 ${LABEL}`}>Import Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      importMode === "merge"
                        ? "border-[#E8C77E] bg-[#E8C77E]/15 text-[#F5F5F0]"
                        : "border-[#1E2C42] bg-[#0B1220]/40 text-[#8CA0BE] hover:border-[#F5F5F0]/30"
                    }`}
                  >
                    <p className="font-bold text-xs">Merge & Update</p>
                    <p className="text-[10px] text-[#8CA0BE] mt-0.5">
                      Adds new titles, keeps existing
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      importMode === "replace"
                        ? "border-red-500 bg-red-500/15 text-white"
                        : "border-[#1E2C42] bg-[#0B1220]/40 text-[#8CA0BE] hover:border-red-500/30"
                    }`}
                  >
                    <p className="font-bold text-xs text-red-300">Replace Library</p>
                    <p className="text-[10px] text-[#8CA0BE] mt-0.5">
                      Overwrites current collection
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportJsonData(null);
                  setImportFileName(null);
                }}
                disabled={importing}
                className={cn(BUTTON_SECONDARY, "flex-1 py-2.5 text-xs")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!importJsonData || importing}
                className={cn(BUTTON_PRIMARY, "flex-1 py-2.5 text-xs font-bold")}
              >
                {importing ? "Importing..." : "Restore Library →"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import RecommendingModal from "@/components/RecommendingModal";
import CoverImage from "@/components/CoverImage";
import Chip from "@/components/Chip";
import TogglePill from "@/components/TogglePill";
import { addMangaToLibrary, fetchLibrary } from "@/lib/api-client";
import { fetchJson, jsonRequest } from "@/lib/http";
import {
  CHAPTER_LENGTH_OPTIONS,
  COMPLETION_STATUS_OPTIONS,
  CONTENT_RATING_OPTIONS,
} from "@/lib/filters";
import { GENRE_OPTIONS, THEME_OPTIONS, isGenre } from "@/lib/genres";
import { parseList, toggleSetItem } from "@/lib/manga";
import type { SavedManga } from "@/lib/types";
import { cn, BUTTON_PRIMARY, BUTTON_SECONDARY, LABEL, statusBadge } from "@/lib/ui";

interface Recommendation {
  title: string;
  synopsis: string;
  reason: string;
  anilistId?: number | null;
  coverUrl?: string | null;
  genres?: string[];
  chapters?: number | null;
  status?: string | null;
  siteUrl?: string | null;
}

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
  const [seenTitles, setSeenTitles] = useState<Set<string>>(new Set());
  const [poolPage, setPoolPage] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRec, setConfirmingRec] = useState<Recommendation | null>(null);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    fetchLibrary()
      .then(setLibrary)
      .catch(() => setLibrary([]));
  }, []);

  const selectedLibraryGenres = Array.from(selectedGenres).filter(isGenre);

  const baseCandidates =
    selectedLibraryGenres.length === 0
      ? library
      : library.filter((m) =>
          parseList(m.genres).some((g) => selectedLibraryGenres.includes(g))
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
      const data = await fetchJson<{
        recommendations: Recommendation[];
        note?: string | null;
      }>(
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
        })
      );

      const batch = data.recommendations ?? [];
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

  async function handleDirectAdd(rec: Recommendation) {
    if (!rec.anilistId) return;
    try {
      await addMangaToLibrary({
        anilistId: rec.anilistId,
        title: rec.title,
        genres: rec.genres ?? [],
        coverUrl: rec.coverUrl ?? null,
        synopsis: rec.synopsis,
        status: rec.status ?? null,
        authors: [],
        publishedFrom: null,
        publishedTo: null,
        chapters: rec.chapters ?? null,
        volumes: null,
        score: null,
        siteUrl: rec.siteUrl ?? null,
      });
      setAddedTitles((prev) => new Set(prev).add(rec.title));
      setToastMessage({
        text: `Added "${rec.title}" to your library!`,
        type: "success",
      });
    } catch {
      setToastMessage({
        text: "Failed to add to library.",
        type: "error",
      });
    }
  }

  function markAlreadyRead(rec: Recommendation) {
    setConfirmingRec(rec);
  }

  async function confirmAddToLibrary() {
    if (!confirmingRec) return;
    setAddingToLibrary(true);

    try {
      const targetId = confirmingRec.anilistId;
      if (targetId) {
        await addMangaToLibrary({
          anilistId: targetId,
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
      setToastMessage({
        text: `Marked "${confirmingRec.title}" as read & saved to library!`,
        type: "success",
      });
    } catch {
      setToastMessage({
        text: "Failed to add to library.",
        type: "error",
      });
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
        primary="-top-24 right-1/4 h-[550px] w-[550px] blur-[150px]"
        secondary="bottom-1/3 -left-20 h-[450px] w-[450px] blur-[120px]"
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
          eyebrow="AI Matchmaker"
          title="Personalized Recommendations"
          description="Candidates are fetched live from AniList GraphQL and intelligently re-ranked by Gemini AI."
        />

        {/* 3-Step Wizard Header */}
        <div className="animate-fade-in-up mb-8 flex items-center justify-between border-b border-[#1E2C42]/80 pb-4" style={{ animationDelay: "0.05s" }}>
          {[
            { id: "filters", label: "1. Preferences & Filters", icon: "⚙️" },
            { id: "base", label: "2. Base Manga Anchor", icon: "🎯" },
            { id: "results", label: "3. AI Results", icon: "✨" },
          ].map((item, i) => {
            const active = step === item.id;
            return (
              <div key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (item.id === "filters") setStep("filters");
                    if (item.id === "base") setStep("base");
                  }}
                  disabled={item.id === "results" && recommendations.length === 0}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                    active
                      ? "bg-[#E8C77E] font-bold text-[#0B1220] shadow-[0_0_20px_rgba(232,199,126,0.35)]"
                      : "text-[#8CA0BE] hover:text-[#F5F5F0]"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
                {i < 2 && <span className="text-[#1E2C42] text-xs">───</span>}
              </div>
            );
          })}
        </div>

        {/* STEP 1: PREFERENCES & FILTERS (Clean 2-Column Layout) */}
        {step === "filters" && (
          <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): Genres & Themes */}
            <div className="lg:col-span-7 space-y-6 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/85 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#F5F5F0] flex items-center gap-2">
                    <span>🎭</span>
                    <span>Genres</span>
                  </h3>
                  {selectedGenres.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedGenres(new Set())}
                      className="font-mono text-[10px] text-[#E8C77E] hover:underline"
                    >
                      Clear ({selectedGenres.size})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map((genre) => (
                    <TogglePill
                      key={genre}
                      active={selectedGenres.has(genre)}
                      onClick={() => toggleGenre(genre)}
                      accent="gold"
                      className="px-3 py-1.5 text-xs"
                    >
                      {genre}
                    </TogglePill>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#1E2C42]/80 pt-5">
                <h3 className="font-bold text-sm text-[#F5F5F0] mb-3 flex items-center gap-2">
                  <span>🏷️</span>
                  <span>Themes & Tropes</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {THEME_OPTIONS.map((theme) => (
                    <TogglePill
                      key={theme}
                      active={selectedGenres.has(theme)}
                      onClick={() => toggleGenre(theme)}
                      accent="gold"
                      className="px-3 py-1.5 text-xs"
                    >
                      {theme}
                    </TogglePill>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Parameters & Prompt */}
            <div className="lg:col-span-5 space-y-6 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/85 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
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

              {/* Custom Prompt Textarea */}
              <div className="border-t border-[#1E2C42]/80 pt-5">
                <p className={`mb-2 ${LABEL}`}>
                  Specific Guidance for Gemini AI
                </p>
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="e.g. realistic martial arts, emotional character arcs, avoid harem tropes, focus on dark psychological suspense..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[#1E2C42] bg-[#0B1220]/75 px-4 py-3 text-xs text-[#F5F5F0] placeholder:text-[#8CA0BE] outline-none backdrop-blur-md transition-all focus:border-[#E8C77E]/60 focus:shadow-[0_0_20px_rgba(232,199,126,0.15)]"
                />
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => setStep("base")}
                  className={cn(BUTTON_PRIMARY, "w-full py-3.5 text-xs font-bold")}
                >
                  <span>Anchor with Base Manga →</span>
                </button>
                <button
                  onClick={() => fetchRecommendations(false, true)}
                  disabled={loading}
                  className={cn(BUTTON_SECONDARY, "w-full py-3 text-xs")}
                >
                  <span>Quick Recommend (Skip Base Anchor)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BASE MANGA SELECTION (Poster Grid) */}
        {step === "base" && (
          <div className="animate-fade-in-up space-y-6 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/85 p-8 shadow-xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2C42]/80 pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#F5F5F0]">
                  Anchor Around Your Favorites
                </h3>
                <p className="text-xs text-[#8CA0BE] mt-1">
                  Gemini will prioritize candidates matching the style, depth, or pacing of the titles you select.
                </p>
              </div>
              {baseMangaIds.size > 0 && (
                <span className="font-mono text-xs font-bold text-[#E8C77E]">
                  {baseMangaIds.size} {baseMangaIds.size === 1 ? "title" : "titles"} selected
                </span>
              )}
            </div>

            {baseCandidates.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {baseCandidates.map((m) => {
                  const selected = baseMangaIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleBaseManga(m.id)}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                        selected
                          ? "border-[#E8C77E] bg-[#E8C77E]/10 shadow-[0_0_25px_rgba(232,199,126,0.25)] ring-2 ring-[#E8C77E]"
                          : "border-[#1E2C42] bg-[#0B1220]/60 hover:border-[#F5F5F0]/40"
                      }`}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0B1220]">
                        <CoverImage src={m.coverUrl} alt={m.title} />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F1B2E] via-transparent to-transparent" />
                        
                        {/* Checkmark badge */}
                        <div
                          className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            selected
                              ? "bg-[#E8C77E] text-[#0B1220] shadow-[0_0_10px_rgba(232,199,126,0.5)]"
                              : "border border-white/20 bg-black/40 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="line-clamp-1 font-semibold text-xs text-[#F5F5F0]">
                          {m.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#1E2C42] bg-[#0B1220]/40 p-8 text-center">
                <p className="text-sm text-[#8CA0BE]">
                  {library.length === 0
                    ? "Your library is empty. Proceed with genre-only recommendations!"
                    : "No manga in your library match your active genre selections."}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#1E2C42]/80 pt-6">
              <button
                onClick={() => setStep("filters")}
                className={cn(BUTTON_SECONDARY, "px-6 py-3 text-xs")}
              >
                ← Back to Preferences
              </button>

              <button
                onClick={() => fetchRecommendations(false, true)}
                disabled={loading}
                className={cn(BUTTON_PRIMARY, "px-8 py-3.5 text-xs font-bold")}
              >
                <span>{loading ? "Thinking..." : "Generate AI Recommendations ✨"}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AI RESULTS (2-Column Showcase Grid) */}
        {step === "results" && (
          <div className="animate-fade-in-up space-y-6">
            {/* Header action bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1E2C42] bg-[#0F1B2E]/90 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#8CA0BE]">
                  Generated <span className="font-bold text-[#F5F5F0]">{recommendations.length}</span> curated picks
                </span>
                {selectedBaseManga.length > 0 && (
                  <span className="rounded-full border border-[#E8C77E]/30 bg-[#E8C77E]/10 px-3 py-0.5 font-mono text-[10px] text-[#E8C77E]">
                    Anchored on: {selectedBaseManga.map((m) => m.title).join(", ")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setStep("filters")}
                  className={cn(BUTTON_SECONDARY, "px-4 py-2 text-xs")}
                >
                  ← Adjust Filters
                </button>
                <button
                  onClick={() => fetchRecommendations(false)}
                  disabled={loading}
                  className={cn(BUTTON_PRIMARY, "px-5 py-2 text-xs font-bold")}
                >
                  {loading ? "Thinking..." : "Suggest More ↻"}
                </button>
                <button
                  onClick={() => fetchRecommendations(true)}
                  disabled={loading}
                  className="rounded-full border border-[#E8C77E] bg-[#E8C77E]/10 px-5 py-2 font-mono text-xs font-bold uppercase text-[#E8C77E] transition-all hover:bg-[#E8C77E] hover:text-[#0B1220] hover:shadow-[0_0_20px_rgba(232,199,126,0.35)] active:scale-95"
                >
                  {loading ? "Thinking..." : "Diverge ✨"}
                </button>
              </div>
            </div>

            {error && <ErrorBanner className="mb-6">{error}</ErrorBanner>}

            {/* 2-Column Showcase Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {recommendations.map((rec, i) => {
                const statusInfo = statusBadge(rec.status);
                const isAdded = addedTitles.has(rec.title);
                const mangafireUrl = `https://mangafire.to/browse?keyword=${encodeURIComponent(rec.title)}&sort=relevance:desc`;
                const comixUrl = `https://comix.to/browse?q=${encodeURIComponent(rec.title)}&sort=relevance%3Adesc`;

                return (
                  <div
                    key={rec.title}
                    style={{ animationDelay: `${Math.min(i, 8) * 0.07}s` }}
                    className="animate-fade-in-up group flex flex-col sm:flex-row gap-4.5 rounded-3xl border border-[#1E2C42] bg-[#0F1B2E]/90 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-[#E8C77E]/50 hover:shadow-[0_15px_35px_rgba(232,199,126,0.15)]"
                  >
                    {/* Cover Poster */}
                    <div className="relative aspect-[2/3] w-32 shrink-0 self-center sm:self-start overflow-hidden rounded-2xl border border-[#1E2C42] bg-[#0B1220] shadow-md">
                      <CoverImage
                        src={rec.coverUrl ?? null}
                        alt={rec.title}
                        imgClassName="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-2 top-2">
                        <span className={`rounded-full border px-2 py-0.2 font-mono text-[8px] font-bold uppercase ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-lg font-bold text-[#F5F5F0] transition-colors group-hover:text-[#E8C77E]">
                          {rec.title}
                        </h3>

                        {/* Metadata line */}
                        <div className="mt-1 mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#8CA0BE]">
                          {rec.chapters && (
                            <span>📖 {rec.chapters} Chapters</span>
                          )}
                          {rec.genres && rec.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {rec.genres.slice(0, 3).map((genre) => (
                                <Chip key={genre} className="text-[9px] px-2 py-0.2">
                                  {genre}
                                </Chip>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Synopsis */}
                        {rec.synopsis && (
                          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[#8CA0BE]">
                            {rec.synopsis}
                          </p>
                        )}

                        {/* Golden AI Rationale Callout */}
                        <div className="mb-4 rounded-2xl border border-[#E8C77E]/35 bg-gradient-to-r from-[#E8C77E]/10 via-[#E8C77E]/5 to-transparent p-3 shadow-inner">
                          <div className="flex items-center gap-1.5 mb-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#E8C77E]">
                            <span>✦</span>
                            <span>Why Gemini picks this</span>
                          </div>
                          <p className="text-xs italic leading-relaxed text-[#F5F5F0]">
                            "{rec.reason}"
                          </p>
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="flex flex-wrap items-center gap-2 border-t border-[#1E2C42]/60 pt-3">
                        <button
                          onClick={() => handleDirectAdd(rec)}
                          disabled={isAdded}
                          className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
                            isAdded
                              ? "border border-[#1E2C42] bg-transparent text-[#8CA0BE]"
                              : "border border-[#E8C77E] bg-[#E8C77E] text-[#0B1220] hover:bg-[#F5F5F0] hover:border-[#F5F5F0] hover:shadow-[0_0_15px_rgba(232,199,126,0.3)] active:scale-95"
                          }`}
                        >
                          {isAdded ? "✓ In Library" : "+ Save"}
                        </button>

                        <button
                          onClick={() => markAlreadyRead(rec)}
                          className={cn(BUTTON_SECONDARY, "px-3 py-1.5 font-mono text-[10px]")}
                        >
                          Read
                        </button>

                        <a
                          href={mangafireUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white transition-all ml-auto"
                        >
                          <span>🔥</span>
                          <span>Read on MangaFire ↗</span>
                        </a>

                        {rec.siteUrl && (
                          <a
                            href={rec.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-[#1E2C42] px-2.5 py-1.5 font-mono text-[10px] text-[#8CA0BE] hover:text-[#E8C77E] transition-all"
                          >
                            AniList ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {recommendations.length === 0 && !error && (
              <EmptyState>
                <p className="text-sm text-[#8CA0BE] mb-4">
                  {note ??
                    'No more recommendations found for these criteria. Try diverging or clearing custom restrictions.'}
                </p>
                <button
                  onClick={() => setStep("filters")}
                  className={cn(BUTTON_PRIMARY, "px-6 py-2.5 text-xs")}
                >
                  Adjust Preferences
                </button>
              </EmptyState>
            )}
          </div>
        )}
      </div>

      {/* Loading Modal */}
      {loading && <RecommendingModal />}

      {/* Already Read Confirmation Modal */}
      {confirmingRec && (
        <Modal title="Mark as Already Read?">
          <div className="mt-2">
            <p className="mb-6 text-sm text-[#8CA0BE] leading-relaxed">
              Add <span className="font-semibold text-[#F5F5F0]">{confirmingRec.title}</span> to your library as "Completed"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={declineAddToLibrary}
                disabled={addingToLibrary}
                className={cn(BUTTON_SECONDARY, "flex-1 py-2.5 text-xs")}
              >
                Just Dismiss
              </button>
              <button
                onClick={confirmAddToLibrary}
                disabled={addingToLibrary}
                className={cn(BUTTON_PRIMARY, "flex-1 py-2.5 text-xs font-bold")}
              >
                {addingToLibrary ? "Saving..." : "Yes, Add as Completed"}
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
      <p className={`mb-2.5 ${LABEL}`}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <TogglePill
            key={opt.value}
            active={value === opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1 text-xs"
          >
            {opt.label}
          </TogglePill>
        ))}
      </div>
    </div>
  );
}
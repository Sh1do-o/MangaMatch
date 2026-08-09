<p align="center">
  <img src="public/logo.png" alt="MangaMatch Logo" width="500" />
</p>

##

A personal manga tracking and AI-powered recommendation app. Search or browse manga, build a personal library of what you're reading (or want to read), organize it with custom categories, and get tailored recommendations based on your genre preferences, reading history, and specific manga you already love — powered by real AniList data, not AI guesswork.

## Features

- **Search** — find manga via the [AniList GraphQL API](https://docs.anilist.co/) (official, no API key needed for public search)
- **Browse** — a "Trending Now / All-Time Popular / Top Rated" tabbed view shown before you search, with an optional genre filter that layers on top of whichever tab is active, and per-tab+genre result caching so revisiting a combination doesn't re-fetch
- **Library**
  - Save manga with full details (cover, synopsis, author, chapters, volumes, publication dates, AniList score, link to the full AniList page)
  - **Grid or List view** toggle
  - **Sort** by Recently Added, Year (Newest/Oldest), Highest Rated, or Latest Update
  - Filter by genre or category, plus a text search across your own library
  - Pick a category right when adding a manga (or skip it), via a quick popup
- **Reading status** — track Planning / Reading / Completed per manga
- **Your own rating** — rate anything in your library on a 1–10 scale
- **Custom categories** — tag manga into your own groupings beyond genre (e.g. "Currently Obsessed"), with a "Manage Categories" panel to delete ones you no longer need
- **AI Recommendations** — a guided 3-step flow built around real data instead of AI-invented titles:
  1. Pick genres, completion status, chapter length, content rating, and optionally add free-text instructions
  2. Optionally select one or more manga from your library to anchor the recommendations
  3. Get 5 suggestions with synopsis + reasoning, real cover art/genres/chapter counts, and a direct link to the full AniList page
  - **How it actually works under the hood:** rather than asking Gemini to recall manga titles from memory (which produces hallucinated titles, wrong chapter counts, and a bias toward older/famous series), the app first pulls a real candidate pool directly from AniList — merging a popularity-sorted batch with a recency-biased batch so recent releases are always represented. If you pick a base manga, AniList's own community "if you liked this, try that" recommendation graph gets merged in too. Gemini's only job is to **rank the best 5 from that real list**, using your genre/status/chapter-length preferences and base manga similarity as soft criteria — so every result is guaranteed to be a real, currently existing manga
  - Recommendations automatically exclude anything already in your library
  - **Already Read** prompts to add it to your library too (with the same category-picker popup as search); **Suggest More** gets a fresh batch (excluding what you've already seen); **Diverge** asks for looser, more varied suggestions

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Fonts | Space Grotesk (display), Inter (body), JetBrains Mono (mono/labels) — all via `next/font/google` |
| Database | SQLite via [Prisma ORM](https://www.prisma.io/) |
| Manga data | [AniList GraphQL API](https://docs.anilist.co/) (official, no auth required) |
| AI ranking | [Gemini API](https://ai.google.dev/) (Gemini 2.5 Flash — free tier) |

> **Note:** `lib/jikan.ts` (a helper for the [Jikan/MyAnimeList API](https://docs.api.jikan.moe/)) is still in the repo but is legacy/unused — the project migrated from Jikan to AniList for search, browse, and recommendations (AniList is more reliable, has no rate-limit outages, and exposes trending/popularity/recommendation data Jikan doesn't). The `MangaResult` field `malId` was kept as the internal ID field name for compatibility even though it now stores an AniList ID.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A free [Gemini API key](https://aistudio.google.com/apikey)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```
   GEMINI_API_KEY=your_key_here
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Tests

Unit tests run on [Vitest](https://vitest.dev/) and cover the API helper libraries (`lib/`) and the route handlers (`app/api/`). All network calls (AniList, Gemini) and Prisma access are mocked, so no API key or database is required.

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with a coverage report (also written to coverage/)
```

## Project Structure

```
app/
  api/
    manga/
      search/          — GET: search AniList by query
      trending/        — GET: browse AniList by trending/popular/top-rated, optional genre filter
      add/              — POST: save a manga to the library
      list/             — GET: fetch the full library
      [id]/             — PATCH (reading status, rating) / DELETE
      [id]/categories/  — POST/DELETE: assign/unassign a category
    categories/         — GET/POST: list/create categories
    categories/[id]/    — DELETE: remove a category
    recommend/          — POST: candidate pool + Gemini ranking, returns 5 recommendations
  library/              — your saved manga: sort, grid/list view, genre/category/text filters
  library/[id]/         — full manga detail page (status, rating, categories, delete)
  search/               — search + browse AniList, add results to library (with category picker)
  recommendations/      — 3-step AI recommendation flow
  layout.tsx            — root layout, font setup, nav
  page.tsx              — home page (hero + recently added)
lib/
  anilist.ts            — AniList GraphQL: search, browse, candidate pool, media recommendations (active)
  jikan.ts               — Jikan/MAL API helper (legacy, currently unused)
  gemini.ts              — builds the ranking prompt, calls Gemini, parses picks
  db.ts                  — Prisma client singleton
components/
  Nav.tsx
  CategoryManager.tsx
  ReadingStatusEditor.tsx
  RatingEditor.tsx
  DeleteMangaButton.tsx
tests/
  lib/                  — unit tests for the AniList/Gemini/Jikan helpers
  api/                  — unit tests for the route handlers
prisma/
  schema.prisma         — Manga + Category models
  migrations/            — migrations tracking schema evolution
  dev.db                 — your local SQLite database (not tracked in git)
```

## How Recommendations Work

This is worth calling out specifically since it's the core feature and the architecture isn't the obvious "just ask an LLM" approach:

1. **`getCandidatePool()`** (`lib/anilist.ts`) queries AniList directly for real manga — one batch sorted by popularity, one batch biased toward the last 2 years — merged and deduplicated. Only completion status is applied as a hard filter here; genre and chapter-length are deliberately **not** hard-filtered server-side, because:
   - AniList's `genre_in` requires a candidate to match *all* listed genres simultaneously, not any one — with several genres selected this can (and does) narrow the real pool to zero
   - Chapter-count filters exclude anything with an unknown chapter count, which is common for ongoing series, and can wipe out an otherwise good pool
2. If you selected a base manga, **`getMediaRecommendations()`** pulls AniList's own community-submitted "similar manga" list for it and merges those in too — a stronger signal than genre overlap alone.
3. A lenient client-side pass removes only candidates whose chapter count or status is *definitively* known and out of range — unknowns are never punished.
4. The resulting real candidates (with real genres/chapters/status/score) are handed to Gemini, which **picks and ranks the best 5 by index** — it cannot invent a title, because it's only ever selecting from a list, never generating one from memory.

## Data Model

- **Manga** — `malId` (unique external ID), `title`, `genres` (comma-separated string), `coverUrl`, `synopsis`, `publicationStatus`, `readingStatus` (`planning` / `reading` / `completed`), `rating` (1–10), `authors`, `publishedFrom`/`publishedTo`, `chapters`, `volumes`, `malScore`, `siteUrl`, `createdAt`, `updatedAt`
- **Category** — `name` (unique), `color` (hex, default gold `#E8C77E`), many-to-many with Manga

Genres and authors are stored as comma-separated strings rather than normalized join tables — simple for a single-user app, but worth revisiting (see Known Limitations) if the schema needs to grow.

## Data & Backup

This app uses a single-user, no-login model — everything is stored locally in `prisma/dev.db` (SQLite). This file **is** your entire library and history. Back it up before reinstalling dependencies from scratch, wiping `node_modules`, or moving the project — it is not tracked in git by default (see `.gitignore`).

## Known Limitations

- Single-user only, no accounts or authentication
- Genres and authors are stored as comma-separated strings, not normalized — makes exact genre filtering and multi-author queries a bit blunt
- Content rating filtering ("safe" mode) is a genre-based heuristic (excludes Hentai/Ecchi tags), not a hard guarantee — AniList doesn't expose a granular content rating field
- No pagination yet — large libraries and browse results render all at once
- `lib/jikan.ts` is dead code left over from the pre-AniList version; safe to remove but kept for now in case of a fallback need
- No image optimization/caching for cover art — covers are hotlinked directly from AniList's CDN
- No tests for the React page/component layer yet — only `lib/` and `app/api/` are covered

## Roadmap Ideas

- Normalize genres/authors into their own tables for real relational filtering
- Pagination for library and browse views
- Export/import library as JSON for easier backup
- Remove or repurpose the legacy Jikan helper
- Read-now links to external reader sites (MangaFire, Comix)
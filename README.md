<p align="center">
  <img src="logo.png" alt="MangaMatch Logo" width="1000" />
</p>

A personal manga tracking and AI-powered recommendation app. Search or browse manga, build a personal library of what you're reading (or want to read), organize it with custom categories, and get tailored recommendations from Gemini based on your genre preferences, reading history, and specific manga you already love.

## Features

- **Search** — find manga via the [AniList GraphQL API](https://docs.anilist.co/) (official, no API key needed for public search)
- **Browse** — a "Trending Now / Popular / Top Rated" tabbed view shown before you search, with an optional genre filter and per-tab result caching so switching tabs doesn't re-fetch
- **Library** — save manga with full details (cover, synopsis, author, chapters, volumes, publication dates, MAL/AniList score, link to the AniList page)
- **Reading status** — track Planning / Reading / Completed per manga
- **Your own rating** — rate anything in your library on a 1–10 scale
- **Custom categories** — tag manga into your own groupings beyond genre (e.g. "Currently Obsessed"), each with its own color chip
- **Filtering** — filter your library by genre or category
- **AI Recommendations** — a guided 3-step flow:
  1. Pick genres, completion status, chapter length, content rating, and optionally add free-text instructions
  2. Optionally select one or more manga from your library to anchor the recommendations
  3. Get 5 AI-generated suggestions (via Gemini) with synopsis + reasoning, each cross-referenced against AniList for real cover art/genres/chapter counts, and a direct link to the full AniList page
  - Recommendations automatically exclude anything already in your library
  - **Already Read** prompts to add it to your library too; **Suggest More** gets a fresh batch (excluding what you've already seen); **Diverge** asks for looser, more varied suggestions

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Fonts | Space Grotesk (display), Inter (body), JetBrains Mono (mono/labels) — all via `next/font/google` |
| Database | SQLite via [Prisma ORM](https://www.prisma.io/) |
| Manga data | [AniList GraphQL API](https://docs.anilist.co/) (official, no auth required) |
| AI recommendations | [Gemini API](https://ai.google.dev/) |

> **Note:** `lib/jikan.ts` (a helper for the [Jikan/MyAnimeList API](https://docs.api.jikan.moe/)) is still in the repo but is legacy/unused — the project migrated from Jikan to AniList for search and browse (AniList is more reliable and supports trending/popularity sorting). The `MangaResult` field `malId` was kept as the internal ID field name for compatibility even though it now stores an AniList ID.

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
    recommend/          — POST: generate AI recommendations
  library/              — your saved manga, filterable by genre/category
  library/[id]/         — full manga detail page (status, rating, categories)
  search/               — search + browse AniList, add results to library
  recommendations/      — 3-step AI recommendation flow
  layout.tsx            — root layout, font setup, nav
  page.tsx              — home page (hero + recently added)
lib/
  anilist.ts            — AniList GraphQL search + browse helper (active)
  jikan.ts               — Jikan/MAL API helper (legacy, currently unused)
  gemini.ts              — Gemini prompt building + API call
  db.ts                  — Prisma client singleton
components/
  Nav.tsx
  CategoryManager.tsx
  ReadingStatusEditor.tsx
  RatingEditor.tsx
  DeleteMangaButton.tsx
prisma/
  schema.prisma         — Manga + Category models
  migrations/           — 6 migrations tracking schema evolution
  dev.db                 — your local SQLite database (not tracked in git)
```

## Data Model

- **Manga** — `malId` (unique external ID), `title`, `genres` (comma-separated string), `coverUrl`, `synopsis`, `publicationStatus`, `readingStatus` (`planning` / `reading` / `completed`), `rating` (1–10), `authors`, `publishedFrom`/`publishedTo`, `chapters`, `volumes`, `malScore`, `siteUrl`, timestamps
- **Category** — `name` (unique), `color` (hex, default gold `#E8C77E`), many-to-many with Manga

Genres and authors are stored as comma-separated strings rather than normalized join tables — simple for a single-user app, but worth revisiting (see Known Limitations) if the schema needs to grow.

## Data & Backup

This app uses a single-user, no-login model — everything is stored locally in `prisma/dev.db` (SQLite). This file **is** your entire library and history. Back it up before reinstalling dependencies from scratch, wiping `node_modules`, or moving the project — it is not tracked in git by default.

## Known Limitations

- Single-user only, no accounts or authentication
- Genres and authors are stored as comma-separated strings, not normalized — makes exact genre filtering and multi-author queries a bit blunt
- AniList's search occasionally can't find AI-recommended titles with unusual formatting (mitigated with fallback title-matching logic in the recommend route, but not foolproof)
- No pagination yet — large libraries and browse results render all at once
- `lib/jikan.ts` is dead code left over from the pre-AniList version; safe to remove but kept for now in case of a fallback need
- No image optimization/caching for cover art — covers are hotlinked directly from AniList's CDN
- No automated tests

## Roadmap Ideas

- Normalize genres/authors into their own tables for real relational filtering
- Pagination for library and browse views
- Export/import library as JSON for easier backup
- Remove or repurpose the legacy Jikan helper

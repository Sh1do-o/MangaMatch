<p align="center">
  <img src="public/logo.png" alt="MangaMatch Logo" width="500" />
</p>

##

A personal manga tracking and AI-powered recommendation app. Search or browse manga, build a personal library of what you're reading (or want to read), organize it with custom categories, and get tailored recommendations based on your genre preferences, reading history, and specific manga you already love — powered by real AniList GraphQL data, not AI guesswork.

## Features

- **Search & Browse**
  - Instant search via the [AniList GraphQL API](https://docs.anilist.co/) (official, no API key needed for public search)
  - "Trending Now / All-Time Popular / Top Rated" tabbed browse view with optional genre filtering and per-tab result caching
  - High-density 4–5 column poster card grid with star scores, publication status chips, and direct reader shortcuts
- **Library**
  - Save manga with rich metadata (2:3 vertical cover art, synopsis, author, chapters, volumes, publication dates, AniList score, and official AniList links)
  - **Sticky Left Vertical Filter Sidebar**: Vertically stacked filters for Reading Status, Custom Categories, and Genres with live item counts and a quick "Reset All" button
  - **High-Density Poster Grid & Compact List View** toggle
  - **Sort** by Recently Added, Title (A-Z), Highest Rated, Year (Newest/Oldest), or Recently Updated
  - In-library text search with instant title filtering
  - Assign categories right when adding a manga (or skip it) via a quick popup
- **Reading Status & Ratings** — Track Planning / Reading / Completed per manga, and rate titles on a 1–10 scale
- **Custom Category Tags** — Tag manga into your own groupings (e.g. "Favorites", "Action Classics"), with a "Manage Categories" panel to create or delete tags
- **Direct Online Reader Shortcuts** — Quick redirection links to **MangaFire** (`mangafire.to`) and **Comix** (`comix.to`) with relevance sorting
- **Library Backup & Restore (JSON Export / Import)**
  - **📥 Export**: One-click downloadable JSON backup containing your entire library, ratings, statuses, and category tags
  - **📤 Import**: Interactive modal with backup validation, preview statistics, and flexible restoration modes (**Merge & Update** or **Replace Library**)
- **AI Recommendations** — Guided 3-step matchmaker built around real data:
  1. Pick genres, themes, completion status, chapter length, content rating, and optional custom instructions for Gemini
  2. Anchor recommendations around one or more favorites from your library
  3. Get a 2-column showcase of 5 suggestions with:
     - **✦ Golden AI Rationale Callout Box**: Explains why Gemini picked the manga for your tastes
     - Full cover poster, chapters, genres, and synopsis
     - Quick "+ Save to Library", "Mark as Read", **🔥 MangaFire ↗**, and **AniList ↗** links
     - Toolbar with "Suggest More ↻" and "Diverge ✨" actions

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router + Turbopack) + TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 + Glassmorphism surfaces |
| Fonts | Space Grotesk (display), Inter (body), JetBrains Mono (labels) — via `next/font/google` |
| Database | SQLite via [Prisma ORM](https://www.prisma.io/) |
| Manga data | [AniList GraphQL API](https://docs.anilist.co/) |
| AI ranking | [Gemini API](https://ai.google.dev/) (Gemini Flash — free tier) |
| Testing | [Vitest](https://vitest.dev/) (11 test suites, 114 passing tests) |
| CI/CD | [GitHub Actions](https://github.com/features/actions) (`.github/workflows/ci.yml`) |

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
   npx prisma db push
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Tests

Unit and integration tests run on [Vitest](https://vitest.dev/) across helper libraries (`lib/`) and route handlers (`app/api/`). Network calls (AniList, Gemini) and Prisma queries are fully mocked.

```bash
npm test              # run all 11 test suites (114 tests)
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

## Project Structure

```
app/
  api/
    manga/
      search/          — GET: search AniList by query
      trending/        — GET: browse AniList by trending/popular/top-rated
      add/             — POST: save a manga to the library
      list/            — GET: fetch the full library
      export/          — GET: export library and categories as JSON backup
      import/          — POST: restore/merge library from JSON backup
      [id]/            — PATCH (status, rating) / DELETE
      [id]/categories/ — POST/DELETE: assign/unassign a category
    categories/        — GET/POST: list/create categories
    categories/[id]/   — DELETE: remove a category
    recommend/         — POST: candidate pool + Gemini ranking
  library/             — personal library with vertical filter sidebar & high-density grid
  library/[id]/        — manga detail page (status, rating, category tags, reader shortcuts, delete)
  search/              — search + browse tabs with 4-5 column poster grid
  recommendations/     — 3-step AI recommendation wizard & 2-column showcase
  layout.tsx           — root layout, font setup, glassmorphism nav
  page.tsx             — landing hero, quick stats & recent covers
lib/
  anilist.ts           — AniList GraphQL client (search, browse, candidate pool, recommendations)
  gemini.ts            — ranking prompt builder & response parser
  api-client.ts        — frontend typed API client (including export/import)
  db.ts                — Prisma client singleton
components/
  Nav.tsx              — glassmorphic navigation bar
  Toast.tsx            — animated feedback toast notifications
  ConfirmModal.tsx     — accessible confirmation dialog
  CategoryManager.tsx  — category tag assignment
  ReadingStatusEditor.tsx — reading status selector
  RatingEditor.tsx     — 10-star rating selector
  DeleteMangaButton.tsx — manga deletion modal trigger
  MangaCardSkeletons.tsx — poster grid loading states
  RecommendingModal.tsx — AI thinking overlay
tests/
  api/                 — route handler unit tests (export/import, add, list, search, recommend, categories)
  lib/                 — AniList GraphQL & Gemini prompt tests
.github/
  workflows/ci.yml     — automated GitHub Actions CI pipeline
```

## How Recommendations Work

1. **`getCandidatePool()`** (`lib/anilist.ts`) queries AniList directly for real manga — one batch sorted by popularity and one batch biased toward the last 2 years, merged and deduplicated.
2. If you selected a base manga, **`getMediaRecommendations()`** pulls AniList's community "similar manga" graph and merges those in too.
3. A lenient filter pass ensures candidates match known completion status and chapter criteria without punishing ongoing series.
4. The resulting real candidate pool is passed to Gemini, which **selects and ranks the top 5 by index**. Gemini never invents titles from memory, and outputs a personalized rationale for each pick.

## Known Limitations

- Single-user local storage model (everything lives in your local SQLite `dev.db`, easily backed up via the built-in Export JSON tool).
- Content rating filtering ("safe" mode) is a tag-based heuristic (excludes Hentai/Ecchi tags).
- No image caching proxy for cover art — covers are loaded directly from AniList's CDN.

## Roadmap Ideas

- **Pagination & Infinite Scroll** for library and browse views (for collections exceeding 100+ titles)
- **Normalized Genre / Author Tables** for complex relational database queries
- **Multi-User Authentication & Cloud Database** (Optional future expansion)
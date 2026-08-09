// Genre vocabulary used by the recommendation filters and the browse tabs.
//
// AniList distinguishes real `genre` values from `tag` values, and its API
// treats them differently: `media(genre: "Isekai")` matches nothing, because
// Isekai is a tag, not a genre — it has to be queried through `tag_in`
// instead (see getCandidatePool in lib/anilist.ts). GENRE_OPTIONS and
// THEME_OPTIONS keep that split explicit so the UI and the AniList query
// layer never drift back out of sync.

// Real AniList genres.
export const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

// AniList tags — queried via tag_in, not genre.
export const THEME_OPTIONS = [
  "Historical",
  "Isekai",
  "School",
  "Seinen",
  "Shoujo",
  "Shounen",
  "Josei",
  "Martial Arts",
  "Tragedy",
  "Harem",
];

export function isGenre(value: string): boolean {
  return (GENRE_OPTIONS as string[]).includes(value);
}

export const STANDARD_GENRES = [...GENRE_OPTIONS, ...THEME_OPTIONS];

// Browsing exposes a shorter list — only the broad genres worth a top-level
// tab filter — plus an "All" pseudo-genre meaning "don't filter".
const BROWSE_GENRE_NAMES = [
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

export const BROWSE_GENRES = [
  "All",
  ...STANDARD_GENRES.filter((g) => BROWSE_GENRE_NAMES.includes(g)),
];

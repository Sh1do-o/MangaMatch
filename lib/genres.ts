// Genre vocabulary used by the recommendation filters and the browse tabs.

export const STANDARD_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Historical",
  "Isekai",
  "Mecha",
  "Music",
  "School",
  "Seinen",
  "Shoujo",
  "Shounen",
  "Josei",
  "Ecchi",
  "Martial Arts",
  "Tragedy",
];

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

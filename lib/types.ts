// Shapes returned by this app's own API, shared by the client pages.

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface SavedManga {
  id: number;
  anilistId: number;
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "genres" TEXT NOT NULL,
    "coverUrl" TEXT,
    "synopsis" TEXT,
    "publicationStatus" TEXT,
    "readingStatus" TEXT NOT NULL DEFAULT 'planning',
    "rating" INTEGER,
    "authors" TEXT,
    "publishedFrom" TEXT,
    "publishedTo" TEXT,
    "chapters" INTEGER,
    "volumes" INTEGER,
    "malScore" REAL,
    "siteUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Manga" ("authors", "chapters", "coverUrl", "createdAt", "genres", "id", "malId", "malScore", "publicationStatus", "publishedFrom", "publishedTo", "rating", "readingStatus", "siteUrl", "synopsis", "title", "volumes") SELECT "authors", "chapters", "coverUrl", "createdAt", "genres", "id", "malId", "malScore", "publicationStatus", "publishedFrom", "publishedTo", "rating", "readingStatus", "siteUrl", "synopsis", "title", "volumes" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE UNIQUE INDEX "Manga_malId_key" ON "Manga"("malId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

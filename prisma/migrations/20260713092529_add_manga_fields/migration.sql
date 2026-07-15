/*
  Warnings:

  - You are about to drop the column `status` on the `Manga` table. All the data in the column will be lost.
  - Added the required column `malId` to the `Manga` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Manga" ("coverUrl", "createdAt", "genres", "id", "rating", "synopsis", "title") SELECT "coverUrl", "createdAt", "genres", "id", "rating", "synopsis", "title" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE UNIQUE INDEX "Manga_malId_key" ON "Manga"("malId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

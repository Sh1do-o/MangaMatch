-- CreateTable
CREATE TABLE "Manga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "genres" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "coverUrl" TEXT,
    "synopsis" TEXT,
    "rating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

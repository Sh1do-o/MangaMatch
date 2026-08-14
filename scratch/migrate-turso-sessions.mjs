import { createClient } from "@libsql/client";

const url = "libsql://mangamatch-db-sh1do-o.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3MDgyMzksImlkIjoiMDFhMDAwMWItYjYwMS03Zjg5LWJlOWEtZTAyYTliMWFhOTc4Iiwia2lkIjoib1F2bzhLejlpcXNBQmlHWE41ejRINEtXV0RHb0FVbHBmRTNlbkczcmRxVSIsInJpZCI6IjAzZTI5ZTM5LTliNDktNGQyZC04NTJiLWM3ZGM5ODNjZWU3NyJ9.Fu7QfriXTqybKgegGgGUXY1SPuINz-_PpW1MOOJP9qVwaE3rYD_eNFv5mPVRFz-OCux9sgYsZGQY90NGawcOCQ";

const client = createClient({ url, authToken });

async function migrate() {
  console.log("Migrating Turso cloud database for session isolation...");

  // Drop old tables and recreate with proper sessionId composite keys
  await client.execute(`DROP TABLE IF EXISTS "_CategoryToManga";`);
  await client.execute(`DROP TABLE IF EXISTS "Manga";`);
  await client.execute(`DROP TABLE IF EXISTS "Category";`);

  const statements = [
    `CREATE TABLE "Manga" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "sessionId" TEXT NOT NULL DEFAULT 'default',
      "anilistId" INTEGER NOT NULL,
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
    );`,
    `CREATE UNIQUE INDEX "Manga_sessionId_anilistId_key" ON "Manga"("sessionId", "anilistId");`,
    `CREATE INDEX "Manga_sessionId_idx" ON "Manga"("sessionId");`,
    
    `CREATE TABLE "Category" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "sessionId" TEXT NOT NULL DEFAULT 'default',
      "name" TEXT NOT NULL,
      "color" TEXT NOT NULL DEFAULT '#E8C77E',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX "Category_sessionId_name_key" ON "Category"("sessionId", "name");`,
    `CREATE INDEX "Category_sessionId_idx" ON "Category"("sessionId");`,

    `CREATE TABLE "_CategoryToManga" (
      "A" INTEGER NOT NULL,
      "B" INTEGER NOT NULL,
      CONSTRAINT "_CategoryToManga_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "_CategoryToManga_B_fkey" FOREIGN KEY ("B") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX "_CategoryToManga_AB_unique" ON "_CategoryToManga"("A", "B");`,
    `CREATE INDEX "_CategoryToManga_B_index" ON "_CategoryToManga"("B");`
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  console.log("✔ Turso cloud tables successfully migrated with multi-session indexes!");
}

migrate().catch(console.error);

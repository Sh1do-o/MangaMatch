import { createClient } from "@libsql/client";

const url = "libsql://mangamatch-db-sh1do-o.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3MDgyMzksImlkIjoiMDFhMDAwMWItYjYwMS03Zjg5LWJlOWEtZTAyYTliMWFhOTc4Iiwia2lkIjoib1F2bzhLejlpcXNBQmlHWE41ejRINEtXV0RHb0FVbHBmRTNlbkczcmRxVSIsInJpZCI6IjAzZTI5ZTM5LTliNDktNGQyZC04NTJiLWM3ZGM5ODNjZWU3NyJ9.Fu7QfriXTqybKgegGgGUXY1SPuINz-_PpW1MOOJP9qVwaE3rYD_eNFv5mPVRFz-OCux9sgYsZGQY90NGawcOCQ";

const client = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS "Manga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
  `CREATE UNIQUE INDEX IF NOT EXISTS "Manga_anilistId_key" ON "Manga"("anilistId");`,
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#E8C77E',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");`,
  `CREATE TABLE IF NOT EXISTS "_CategoryToManga" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CategoryToManga_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryToManga_B_fkey" FOREIGN KEY ("B") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "_CategoryToManga_AB_unique" ON "_CategoryToManga"("A", "B");`,
  `CREATE INDEX IF NOT EXISTS "_CategoryToManga_B_index" ON "_CategoryToManga"("B");`
];

async function main() {
  console.log("Connecting to Turso cloud database...");
  for (const sql of statements) {
    await client.execute(sql);
  }
  console.log("✔ Schema successfully created and pushed to Turso!");
  
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log("Active tables in Turso:", tables.rows.map(r => r.name));
}

main().catch(console.error);

import { createClient } from "@libsql/client";

const url = "libsql://mangamatch-db-sh1do-o.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3MDgyMzksImlkIjoiMDFhMDAwMWItYjYwMS03Zjg5LWJlOWEtZTAyYTliMWFhOTc4Iiwia2lkIjoib1F2bzhLejlpcXNBQmlHWE41ejRINEtXV0RHb0FVbHBmRTNlbkczcmRxVSIsInJpZCI6IjAzZTI5ZTM5LTliNDktNGQyZC04NTJiLWM3ZGM5ODNjZWU3NyJ9.Fu7QfriXTqybKgegGgGUXY1SPuINz-_PpW1MOOJP9qVwaE3rYD_eNFv5mPVRFz-OCux9sgYsZGQY90NGawcOCQ";

const client = createClient({ url, authToken });

async function clean() {
  // Check default session or any test rows
  const res = await client.execute(`SELECT id, title, "sessionId" FROM "Manga";`);
  console.log("Current total manga rows:", res.rows.length);
  for (const row of res.rows) {
    console.log(`- [${row.sessionId}] id: ${row.id}, title: ${row.title}`);
  }
}

clean().catch(console.error);

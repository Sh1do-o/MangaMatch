import { createClient } from "@libsql/client";

const url = "libsql://mangamatch-db-sh1do-o.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3MDgyMzksImlkIjoiMDFhMDAwMWItYjYwMS03Zjg5LWJlOWEtZTAyYTliMWFhOTc4Iiwia2lkIjoib1F2bzhLejlpcXNBQmlHWE41ejRINEtXV0RHb0FVbHBmRTNlbkczcmRxVSIsInJpZCI6IjAzZTI5ZTM5LTliNDktNGQyZC04NTJiLWM3ZGM5ODNjZWU3NyJ9.Fu7QfriXTqybKgegGgGUXY1SPuINz-_PpW1MOOJP9qVwaE3rYD_eNFv5mPVRFz-OCux9sgYsZGQY90NGawcOCQ";

const client = createClient({ url, authToken });

async function check() {
  const res = await client.execute(`SELECT id, title, "sessionId", "createdAt" FROM "Manga" ORDER BY "createdAt" DESC;`);
  console.log("Total rows:", res.rows.length);
  console.log(res.rows);
}

check().catch(console.error);

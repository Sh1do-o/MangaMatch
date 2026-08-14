import { createClient } from "@libsql/client";

const url = "libsql://mangamatch-db-sh1do-o.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3MDgyMzksImlkIjoiMDFhMDAwMWItYjYwMS03Zjg5LWJlOWEtZTAyYTliMWFhOTc4Iiwia2lkIjoib1F2bzhLejlpcXNBQmlHWE41ejRINEtXV0RHb0FVbHBmRTNlbkczcmRxVSIsInJpZCI6IjAzZTI5ZTM5LTliNDktNGQyZC04NTJiLWM3ZGM5ODNjZWU3NyJ9.Fu7QfriXTqybKgegGgGUXY1SPuINz-_PpW1MOOJP9qVwaE3rYD_eNFv5mPVRFz-OCux9sgYsZGQY90NGawcOCQ";

const client = createClient({ url, authToken });

const realCovers = [
  { title: "The Extra’s Academy Survival Guide", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx172619-LSoXY45QAas4.jpg", anilistId: 172619 },
  { title: "Omniscient Reader", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg", anilistId: 119257 },
  { title: "Sousou no Frieren", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118586-CXKgWikBFQgS.jpg", anilistId: 118586 },
  { title: "Solo Leveling", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg", anilistId: 105398 },
  { title: "Dungeon Meshi", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86082-MXizJxzbijdd.jpg", anilistId: 86082 },
  { title: "The Eminence in Shadow", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106758-jtXpQYQqyNJv.jpg", anilistId: 106758 },
  { title: "Chainsaw Man", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png", anilistId: 105778 },
  { title: "Berserk", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg", anilistId: 30002 },
  { title: "Jujutsu Kaisen", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg", anilistId: 101517 },
  { title: "SPY x FAMILY", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108556-NHjkz0BNJhLx.jpg", anilistId: 108556 },
  { title: "Pick Me Up, Infinite Gacha", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx159441-9W8201jAT9Yv.jpg", anilistId: 159441 },
  { title: "Blue Lock", coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106130-yPNeuSu75ey1.jpg", anilistId: 106130 },
];

async function updateAllCovers() {
  console.log("Updating cover URLs across all sessions in Turso...");
  for (const item of realCovers) {
    await client.execute({
      sql: `UPDATE "Manga" SET "coverUrl" = ?, "anilistId" = ? WHERE "title" LIKE ? OR "title" LIKE ?;`,
      args: [item.coverUrl, item.anilistId, `%${item.title.slice(0, 8)}%`, `%${item.title}%`],
    });
  }
  console.log("✔ All existing rows in Turso updated with real covers!");
}

updateAllCovers().catch(console.error);

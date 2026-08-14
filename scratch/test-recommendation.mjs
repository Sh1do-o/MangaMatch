import { getCandidatePool } from "../lib/anilist";
import { rankCandidates } from "../lib/gemini";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const start = Date.now();
  console.log("Fetching candidates for [Romance, Fantasy, Isekai]...");
  const pool = await getCandidatePool({
    genres: ["Romance", "Fantasy", "Isekai"],
    completionStatus: "any",
    chapterLength: "any",
  });
  console.log(`Fetched ${pool.length} candidates in ${Date.now() - start}ms`);

  const topPool = pool.slice(0, 25);
  const candidatesForGemini = topPool.map((m) => ({
    anilistId: m.anilistId,
    title: m.title,
    genres: m.genres,
    synopsis: m.synopsis,
    chapters: m.chapters,
    status: m.status,
    score: m.score,
  }));

  console.log("Ranking with Gemini 2.5 Flash...");
  const geminiStart = Date.now();
  const picks = await rankCandidates(candidatesForGemini, {
    genres: ["Romance", "Fantasy", "Isekai"],
    completionStatus: "any",
    chapterLength: "any",
    baseManga: [],
    diverge: false,
    customQuery: "",
  });
  console.log(`Gemini ranked in ${Date.now() - geminiStart}ms. Total: ${Date.now() - start}ms`);

  console.log("\n--- Top Recommendations ---");
  picks.slice(0, 5).forEach((p, idx) => {
    const item = topPool[p.index];
    console.log(`${idx + 1}. ${item.title}`);
    console.log(`   Genres/Themes: ${item.genres.join(", ")}`);
    console.log(`   Reason: ${p.reason}`);
  });
}

// run

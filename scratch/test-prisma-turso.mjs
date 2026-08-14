import "dotenv/config";
import { prisma } from "../lib/db.ts";

async function testPrismaTurso() {
  console.log("Testing Prisma client connection to Turso...");
  const categories = await prisma.category.findMany();
  console.log("✔ Query succeeded! Found categories in Turso:", categories.length);
  
  const manga = await prisma.manga.findMany();
  console.log("✔ Query succeeded! Found manga in Turso:", manga.length);
}

testPrismaTurso().catch(console.error);

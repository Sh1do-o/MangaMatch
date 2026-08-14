// Prisma client singleton.
// Supports local SQLite (file:./dev.db) and Turso cloud libSQL (libsql://...) on Vercel.
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionUrl = process.env.DATABASE_URL || "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Use Turso LibSQL adapter if connection is a cloud URL or auth token is provided
  if (
    connectionUrl.startsWith("libsql://") ||
    connectionUrl.startsWith("https://") ||
    Boolean(authToken)
  ) {
    const adapter = new PrismaLibSql({
      url: connectionUrl,
      authToken: authToken,
    });
    return new PrismaClient({ adapter });
  }

  // Fallback for standard local SQLite (file:./dev.db)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
// GET /api/manga/list
// Returns all manga saved in the library for the current session, most recently added first.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serverError } from "@/lib/api";
import { getSessionId, SESSION_COOKIE } from "@/lib/session";
import { seedStarterLibraryIfEmpty } from "@/lib/starter-data";

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionId(req);

    // Auto-seed starter pack if this session is brand new
    await seedStarterLibraryIfEmpty(sessionId);

    const manga = await prisma.manga.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    });

    const response = NextResponse.json({ manga });
    
    // Ensure cookie is set for the client
    response.cookies.set(SESSION_COOKIE, sessionId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (err) {
    return serverError(err, "Failed to load library");
  }
}

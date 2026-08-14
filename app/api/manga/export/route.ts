import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionId(req);

    const [categories, mangaList] = await Promise.all([
      prisma.category.findMany({
        where: { sessionId },
        orderBy: { name: "asc" },
      }),
      prisma.manga.findMany({
        where: { sessionId },
        include: {
          categories: {
            select: { name: true },
          },
        },
        orderBy: { title: "asc" },
      }),
    ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: categories.map((c) => ({
        name: c.name,
      })),
      library: mangaList.map((m) => ({
        anilistId: m.anilistId,
        title: m.title,
        genres: m.genres,
        coverUrl: m.coverUrl,
        synopsis: m.synopsis,
        publicationStatus: m.publicationStatus,
        readingStatus: m.readingStatus,
        rating: m.rating,
        authors: m.authors,
        publishedFrom: m.publishedFrom,
        publishedTo: m.publishedTo,
        chapters: m.chapters,
        volumes: m.volumes,
        malScore: m.malScore,
        siteUrl: m.siteUrl,
        categories: m.categories.map((c) => c.name),
      })),
    };

    return NextResponse.json(backupData, {
      headers: {
        "Content-Disposition": `attachment; filename="mangamatch-library-${new Date().toISOString().split("T")[0]}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to export library:", error);
    return NextResponse.json(
      { error: "Failed to export library backup" },
      { status: 500 }
    );
  }
}

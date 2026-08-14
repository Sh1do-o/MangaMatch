import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

interface ImportedMangaEntry {
  anilistId: number;
  title: string;
  genres?: string | null;
  coverUrl?: string | null;
  synopsis?: string | null;
  publicationStatus?: string | null;
  readingStatus?: string | null;
  rating?: number | null;
  authors?: string | null;
  publishedFrom?: string | null;
  publishedTo?: string | null;
  chapters?: number | null;
  volumes?: number | null;
  malScore?: number | null;
  siteUrl?: string | null;
  categories?: string[];
}

interface BackupPayload {
  version?: number;
  categories?: { name: string }[];
  library: ImportedMangaEntry[];
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getSessionId(req);
    const body = (await req.json()) as BackupPayload & { mode?: "merge" | "replace" };
    const mode = body.mode === "replace" ? "replace" : "merge";

    if (!body || !Array.isArray(body.library)) {
      return NextResponse.json(
        { error: "Invalid backup format. Expected a JSON object with a 'library' array." },
        { status: 400 }
      );
    }

    const { library, categories = [] } = body;

    let importedCount = 0;
    let updatedCount = 0;
    let createdCategoriesCount = 0;

    await prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        await tx.manga.deleteMany({ where: { sessionId } });
      }

      // Pre-create any categories mentioned in categories list or individual manga
      const categoryNamesToEnsure = new Set<string>();
      for (const cat of categories) {
        if (cat.name && typeof cat.name === "string" && cat.name.trim()) {
          categoryNamesToEnsure.add(cat.name.trim());
        }
      }
      for (const item of library) {
        if (Array.isArray(item.categories)) {
          for (const catName of item.categories) {
            if (typeof catName === "string" && catName.trim()) {
              categoryNamesToEnsure.add(catName.trim());
            }
          }
        }
      }

      const categoryMap = new Map<string, number>();

      for (const name of categoryNamesToEnsure) {
        const existing = await tx.category.findUnique({
          where: {
            sessionId_name: {
              sessionId,
              name,
            },
          },
        });
        if (!existing) {
          const created = await tx.category.create({
            data: {
              sessionId,
              name,
            },
          });
          categoryMap.set(name, created.id);
          createdCategoriesCount++;
        } else {
          categoryMap.set(name, existing.id);
        }
      }

      // Import each manga
      for (const item of library) {
        if (!item.anilistId || !item.title) {
          continue;
        }

        const validCategoryIds = Array.isArray(item.categories)
          ? item.categories
              .map((c) => (typeof c === "string" ? categoryMap.get(c.trim()) : undefined))
              .filter((id): id is number => id !== undefined)
              .map((id) => ({ id }))
          : [];

        const existing = await tx.manga.findUnique({
          where: {
            sessionId_anilistId: {
              sessionId,
              anilistId: item.anilistId,
            },
          },
        });

        if (existing) {
          await tx.manga.update({
            where: { id: existing.id },
            data: {
              title: item.title,
              genres: item.genres ?? existing.genres,
              coverUrl: item.coverUrl ?? existing.coverUrl,
              synopsis: item.synopsis ?? existing.synopsis,
              publicationStatus: item.publicationStatus ?? existing.publicationStatus,
              readingStatus: item.readingStatus ?? existing.readingStatus,
              rating: item.rating !== undefined ? item.rating : existing.rating,
              authors: item.authors ?? existing.authors,
              publishedFrom: item.publishedFrom ?? existing.publishedFrom,
              publishedTo: item.publishedTo ?? existing.publishedTo,
              chapters: item.chapters ?? existing.chapters,
              volumes: item.volumes ?? existing.volumes,
              malScore: item.malScore ?? existing.malScore,
              siteUrl: item.siteUrl ?? existing.siteUrl,
              ...(validCategoryIds.length > 0 && {
                categories: {
                  set: validCategoryIds,
                },
              }),
            },
          });
          updatedCount++;
        } else {
          await tx.manga.create({
            data: {
              sessionId,
              anilistId: item.anilistId,
              title: item.title,
              genres: item.genres ?? "",
              coverUrl: item.coverUrl ?? null,
              synopsis: item.synopsis ?? null,
              publicationStatus: item.publicationStatus ?? null,
              readingStatus: item.readingStatus ?? "planning",
              rating: item.rating ?? null,
              authors: item.authors ?? "",
              publishedFrom: item.publishedFrom ?? null,
              publishedTo: item.publishedTo ?? null,
              chapters: item.chapters ?? null,
              volumes: item.volumes ?? null,
              malScore: item.malScore ?? null,
              siteUrl: item.siteUrl ?? null,
              categories: {
                connect: validCategoryIds,
              },
            },
          });
          importedCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      mode,
      importedCount,
      updatedCount,
      totalProcessed: importedCount + updatedCount,
      createdCategoriesCount,
    });
  } catch (error) {
    console.error("Failed to import library backup:", error);
    return NextResponse.json(
      { error: "Failed to process backup file. Please check file structure." },
      { status: 500 }
    );
  }
}

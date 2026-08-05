// POST /api/manga/add
// Saves a manga (picked from search results) into the local database.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError } from "@/lib/api";
import type { MangaResult } from "@/lib/anilist";
import { HttpError, errorResponse, parseJsonBody } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = (await parseJsonBody(req)) as Partial<MangaResult> | null;

    if (typeof body?.malId !== "number" || typeof body.title !== "string") {
      throw new HttpError(400, "Missing or invalid required fields: malId (number), title (string)");
    }
    // Guarded explicitly because `genres.join()` on a missing/non-array value
    // throws a TypeError that would otherwise surface as a generic 500.
    if (body.genres !== undefined && !Array.isArray(body.genres)) {
      throw new HttpError(400, "'genres' must be an array of strings");
    }
    if (body.authors !== undefined && body.authors !== null && !Array.isArray(body.authors)) {
      throw new HttpError(400, "'authors' must be an array of strings");
    }

    const manga = await prisma.manga.upsert({
      where: { malId: body.malId },
      update: {}, // if it already exists, do nothing — just confirm success
      create: {
        malId: body.malId,
        title: body.title,
        genres: (body.genres ?? []).join(","),
        coverUrl: body.coverUrl ?? null,
        synopsis: body.synopsis ?? null,
        publicationStatus: body.status ?? null,
        readingStatus: "planning",
        authors: body.authors?.join(",") ?? null,
        publishedFrom: body.publishedFrom ?? null,
        publishedTo: body.publishedTo ?? null,
        chapters: body.chapters ?? null,
        volumes: body.volumes ?? null,
        malScore: body.score ?? null,
        siteUrl: body.siteUrl ?? null,
      },
    });

    return NextResponse.json({ success: true, manga });
  } catch (err) {
    return errorResponse(err, {
      fallback: "Failed to save manga to library",
    });
  }
}

// POST /api/manga/add
// Saves a manga (picked from search results) into the local database.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError } from "@/lib/api";
import type { MangaResult } from "@/lib/anilist";

export async function POST(req: NextRequest) {
  const body: MangaResult = await req.json();

  if (!body.malId || !body.title) {
    return badRequest("Missing required fields: malId, title");
  }

  try {
    const manga = await prisma.manga.upsert({
      where: { malId: body.malId },
      update: {}, // if it already exists, do nothing — just confirm success
      create: {
        malId: body.malId,
        title: body.title,
        genres: body.genres.join(","),
        coverUrl: body.coverUrl,
        synopsis: body.synopsis,
        publicationStatus: body.status,
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
    return serverError(err, "Failed to save manga to library");
  }
}

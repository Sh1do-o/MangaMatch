// POST /api/manga/add
// Saves a manga (picked from search results) into the local database.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  parseHttpUrl,
  parseOptionalInteger,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  parseStringArray,
  readJsonBody,
} from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const malId = parseOptionalInteger(body.malId);
  const title = parseString(body.title, MAX_TITLE_LENGTH);
  const genres = parseStringArray(body.genres, MAX_TITLE_LENGTH);
  const authors = parseStringArray(body.authors, MAX_TITLE_LENGTH);

  if (!malId || !title || !genres || !authors) {
    return NextResponse.json(
      { error: "Invalid or missing fields: malId, title, genres, authors" },
      { status: 400 }
    );
  }

  try {
    const manga = await prisma.manga.upsert({
      where: { malId },
      update: {}, // if it already exists, do nothing — just confirm success
      create: {
        malId,
        title,
        genres: genres.join(","),
        coverUrl: parseHttpUrl(body.coverUrl),
        synopsis: parseOptionalString(body.synopsis, MAX_TEXT_LENGTH),
        publicationStatus: parseOptionalString(body.status, MAX_TITLE_LENGTH),
        readingStatus: "planning",
        authors: authors.length > 0 ? authors.join(",") : null,
        publishedFrom: parseOptionalString(body.publishedFrom, 32),
        publishedTo: parseOptionalString(body.publishedTo, 32),
        chapters: parseOptionalInteger(body.chapters),
        volumes: parseOptionalInteger(body.volumes),
        malScore: parseOptionalNumber(body.score),
        siteUrl: parseHttpUrl(body.siteUrl),
      },
    });

    return NextResponse.json({ success: true, manga });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save manga to library" },
      { status: 500 }
    );
  }
}

// POST /api/manga/add
// Saves a manga (picked from search results) into the database scoped to current session.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError } from "@/lib/api";
import { getSessionId } from "@/lib/session";
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
    return badRequest("Invalid JSON body");
  }

  const anilistId = parseOptionalInteger(body.anilistId ?? body.malId);
  const title = parseString(body.title, MAX_TITLE_LENGTH);
  const genres = parseStringArray(body.genres, MAX_TITLE_LENGTH);
  const authors = parseStringArray(body.authors, MAX_TITLE_LENGTH);

  if (!anilistId || !title || !genres || !authors) {
    return badRequest(
      "Invalid or missing fields: anilistId, title, genres, authors"
    );
  }

  try {
    const sessionId = await getSessionId(req);

    const manga = await prisma.manga.upsert({
      where: {
        sessionId_anilistId: {
          sessionId,
          anilistId,
        },
      },
      update: {}, // if it already exists, do nothing — just confirm success
      create: {
        sessionId,
        anilistId,
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
    return serverError(err, "Failed to save manga to library");
  }
}

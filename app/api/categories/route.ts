// GET  /api/categories        -> list all categories for current session
// POST /api/categories        -> create a new category { name, color? } for current session
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, errorResponse, serverError } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import {
  MAX_TITLE_LENGTH,
  parseHexColor,
  parseString,
  readJsonBody,
} from "@/lib/validation";

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  );
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionId(req);
    const categories = await prisma.category.findMany({
      where: { sessionId },
      orderBy: { name: "asc" },
      include: { _count: { select: { manga: true } } },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return serverError(err, "Failed to load categories");
  }
}

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (!body) {
    return badRequest("Invalid JSON body");
  }

  const name = parseString(body.name, MAX_TITLE_LENGTH);
  if (!name) {
    return badRequest(
      `'name' must be a non-empty string of at most ${MAX_TITLE_LENGTH} characters`
    );
  }

  const color = body.color === undefined ? "#E8C77E" : parseHexColor(body.color);
  if (!color) {
    return badRequest("'color' must be a hex color like #E8C77E");
  }

  try {
    const sessionId = await getSessionId(req);
    const category = await prisma.category.create({
      data: { sessionId, name, color },
    });
    return NextResponse.json({ success: true, category });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return errorResponse("A category with that name already exists", 409);
    }
    return serverError(err, "Failed to create category");
  }
}

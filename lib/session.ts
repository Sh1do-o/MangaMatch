import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const SESSION_COOKIE = "mangamatch_session";

/**
 * Extracts the sessionId from request headers or cookies.
 * Falls back to "default" if running outside a request context.
 */
export async function getSessionId(req?: Request | NextRequest): Promise<string> {
  if (req) {
    // 1. Check custom header (passed by client api-client)
    const headerSession = req.headers.get("x-session-id");
    if (headerSession && headerSession.trim()) {
      return headerSession.trim();
    }

    // 2. Check NextRequest cookies
    if ("cookies" in req && typeof req.cookies?.get === "function") {
      const cookieVal = req.cookies.get(SESSION_COOKIE)?.value;
      if (cookieVal && cookieVal.trim()) {
        return cookieVal.trim();
      }
    }

    // 3. Check raw Cookie header on standard Request
    const rawCookie = req.headers.get("cookie");
    if (rawCookie) {
      const match = rawCookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
      if (match && match[1]) {
        return decodeURIComponent(match[1]).trim();
      }
    }
  }

  // 4. Try Next.js server cookies() context
  try {
    const cookieStore = await cookies();
    const serverCookie = cookieStore.get(SESSION_COOKIE)?.value;
    if (serverCookie && serverCookie.trim()) {
      return serverCookie.trim();
    }
  } catch {
    // cookies() can throw if called outside Next.js request lifecycle
  }

  return "default";
}

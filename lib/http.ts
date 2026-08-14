// Browser-side fetch helpers. Every client call to this app's API expects
// JSON back and reports failures from the same `{ error, details }` shape.

const SESSION_STORAGE_KEY = "mangamatch_session";

/**
 * Gets or creates a persistent client-side UUID for anonymous guest session isolation.
 */
export function getClientSessionId(): string {
  if (typeof window === "undefined") return "default";
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id || id.trim() === "") {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "session_" + Math.random().toString(36).slice(2);
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "default";
  }
}

/** RequestInit for a JSON body request (POST/PATCH/DELETE with a payload). */
export function jsonRequest(method: string, body: unknown): RequestInit {
  const sessionId = getClientSessionId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionId && sessionId !== "default") {
    headers["x-session-id"] = sessionId;
  }

  return {
    method,
    headers,
    body: JSON.stringify(body),
  };
}

/**
 * Fetches JSON, throwing an Error carrying the API's own message when the
 * response is not ok. Automatically attaches the guest x-session-id header.
 */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const sessionId = getClientSessionId();
  const headers = new Headers(init?.headers);
  if (!headers.has("x-session-id") && sessionId && sessionId !== "default") {
    headers.set("x-session-id", sessionId);
  }

  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.details || data.error)) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

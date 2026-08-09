// Browser-side fetch helpers. Every client call to this app's API expects
// JSON back and reports failures from the same `{ error, details }` shape.

/** RequestInit for a JSON body request (POST/PATCH/DELETE with a payload). */
export function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/**
 * Fetches JSON, throwing an Error carrying the API's own message when the
 * response is not ok.
 */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.details || data.error)) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

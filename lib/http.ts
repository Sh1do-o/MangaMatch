// Client-side fetch helper.
//
// Every call site used to hand-roll this, and most of them did it by
// throwing an empty `new Error()` on a non-2xx response — which discarded
// the message the API had just gone to the trouble of returning. This keeps
// the server's message intact so the UI can actually show what went wrong.

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Body wasn't JSON (e.g. an HTML error page); handled below.
  }

  if (!res.ok) {
    const payload = data as { error?: string; details?: string } | null;
    const summary = payload?.error ?? `Request failed (${res.status})`;
    // `details` carries the underlying cause (an AniList/Gemini failure, a
    // database error) — worth showing, since "Failed to generate
    // recommendations" alone tells the user nothing actionable.
    throw new Error(
      payload?.details ? `${summary} — ${payload.details}` : summary
    );
  }

  if (data === null) {
    throw new Error("The server returned an unexpected (non-JSON) response.");
  }

  return data as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

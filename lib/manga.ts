// Domain constants and helpers shared by the API routes and the UI.

export const READING_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
] as const;

export const READING_STATUS_VALUES: string[] = READING_STATUSES.map(
  (s) => s.value
);

/** Splits a comma-separated column (genres, authors) into a clean list. */
export function parseList(value: string | null | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

/** Returns a new Set with `item` added if absent, removed if present. */
export function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) {
    next.delete(item);
  } else {
    next.add(item);
  }
  return next;
}

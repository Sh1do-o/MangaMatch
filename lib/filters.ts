// Recommendation filter vocabulary. The option lists rendered in the UI and
// the predicates applied server-side are defined together so the labels can
// never drift from the thresholds they describe.

export const COMPLETION_STATUS_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

export const CHAPTER_LENGTH_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "short", label: "Short (< 100 ch.)" },
  { value: "medium", label: "Medium (100-400 ch.)" },
  { value: "long", label: "Long (400+ ch.)" },
];

export const CONTENT_RATING_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "safe", label: "Safe / All Ages" },
  { value: "mature", label: "Mature" },
];

/** AniList `MediaStatus` values behind each completion status option. */
export function anilistStatusList(
  completionStatus: string
): string[] | undefined {
  if (completionStatus === "ongoing") return ["RELEASING", "HIATUS"];
  if (completionStatus === "completed") return ["FINISHED"];
  return undefined;
}

export function matchesCompletionStatus(
  status: string | null,
  completionStatus: string
): boolean {
  const allowed = anilistStatusList(completionStatus);
  // A missing status is treated as a pass, not a fail — filtering it out
  // would discard otherwise good candidates over incomplete metadata.
  if (!allowed || !status) return true;
  return allowed.includes(status);
}

export function matchesChapterLength(
  chapters: number | null,
  chapterLength: string
): boolean {
  // Unknown chapter counts are treated as a pass, not a fail — AniList
  // frequently doesn't track an exact count for ongoing series, and
  // excluding those would wipe out otherwise perfectly good candidates.
  if (chapterLength === "any" || chapters === null) return true;
  if (chapterLength === "short") return chapters < 100;
  if (chapterLength === "medium") return chapters >= 100 && chapters <= 400;
  if (chapterLength === "long") return chapters > 400;
  return true;
}

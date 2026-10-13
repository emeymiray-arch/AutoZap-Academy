/** Sequential unlock from already-loaded progress — no extra DB round-trips. */

export function buildLessonUnlockMap(
  lessons: Array<{ id: string; position: number }>,
  completedLessonIds: Set<string> | Iterable<string>,
): Map<string, boolean> {
  const done = completedLessonIds instanceof Set ? completedLessonIds : new Set(completedLessonIds);
  const sorted = [...lessons].sort((a, b) => a.position - b.position);
  const map = new Map<string, boolean>();
  let priorAllDone = true;
  for (const lesson of sorted) {
    map.set(lesson.id, priorAllDone);
    if (!done.has(lesson.id)) priorAllDone = false;
  }
  return map;
}

import type { LectureWeek } from "@/lib/calendar-api";

/**
 * Builds a Map from ISO date string ("YYYY-MM-DD") to lecture week number.
 * Each week's days are iterated so any day Mon–Sun maps to that week's number.
 */
export function buildDateToWeekNumberMap(
  weeks: LectureWeek[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const week of weeks) {
    for (const day of week.days) {
      if (day.date) map.set(day.date, week.weekNumber);
    }
  }
  return map;
}

export function getLectureWeekNumberForDate(
  map: Map<string, number>,
  dateStr: string
): number | null {
  return map.get(dateStr) ?? null;
}

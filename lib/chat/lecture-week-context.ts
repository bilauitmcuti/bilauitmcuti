import { fetchLectureWeeks, type LectureWeek } from "@/lib/calendar-api";
import type { CalendarContextIntent } from "@/lib/chat/calendar-intent";
import { sessionLabelForContext } from "@/lib/chat/context";
import { toDateFormat } from "@/lib/chat/dates";
import {
  buildDateToWeekNumberMap,
  getLectureWeekNumberForDate,
} from "@/lib/lecture-weeks-resolve";
import type { SessionId } from "@/lib/data";

const LECTURE_WEEK_MESSAGE_HINTS = [
  "minggu kuliah",
  "lecture week",
  "week berapa",
  "minggu berapa",
  "current week",
  "minggu sekarang",
  "minggu ke",
];

export function needsLectureWeekContext(
  intent: CalendarContextIntent,
  message: string
): boolean {
  if (intent === "lecture" || intent === "lecture_count" || intent === "days_until") {
    return true;
  }
  const lower = message.toLowerCase();
  return LECTURE_WEEK_MESSAGE_HINTS.some((h) => lower.includes(h));
}

function findWeekByNumber(weeks: LectureWeek[], weekNumber: number): LectureWeek | undefined {
  return weeks.find((w) => w.weekNumber === weekNumber);
}

export function formatLectureWeekLineFromWeeks(
  sessionId: SessionId,
  todayISO: string,
  weeks: LectureWeek[]
): string {
  const label = sessionLabelForContext(sessionId);
  const map = buildDateToWeekNumberMap(weeks);
  const weekNum = getLectureWeekNumberForDate(map, todayISO);
  if (weekNum == null) {
    return `CURRENT LECTURE WEEK [${label}]: Not in lecture period (today ${toDateFormat(todayISO)})`;
  }
  const week = findWeekByNumber(weeks, weekNum);
  const range =
    week?.rangeLabel ||
    (week?.weekStart && week?.weekEnd
      ? `${toDateFormat(week.weekStart)} to ${toDateFormat(week.weekEnd)}`
      : "");
  return `CURRENT LECTURE WEEK [${label}]: Minggu Kuliah ${weekNum}${range ? ` (${range})` : ""}`;
}

export async function buildLectureWeekQuickReference(
  sessionIds: SessionId[],
  todayISO: string
): Promise<string> {
  if (sessionIds.length === 0) return "";

  const results = await Promise.all(
    sessionIds.map(async (sid) => {
      try {
        const { weeks } = await fetchLectureWeeks(sid);
        return formatLectureWeekLineFromWeeks(sid, todayISO, weeks);
      } catch {
        return `CURRENT LECTURE WEEK [${sessionLabelForContext(sid)}]: (lecture week data unavailable)`;
      }
    })
  );

  return results.join("\n");
}

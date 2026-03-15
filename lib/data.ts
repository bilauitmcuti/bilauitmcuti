export type ActivityType = 'registration' | 'lecture' | 'examination' | 'break' | 'other';

// Default filter states - single source of truth
export const DEFAULT_FILTER_STATES = {
  showKKT: false,
  showRegistration: true,
  showLecture: true,
  showSemesterPendek: false,
  showKuliahIntersesi: false,
  showExamination: true,
  showOthersExams: false,
  showBreak: true,
  showCountdown: true,
} as const;

export interface Activity {
  name: string;
  details?: string;
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  regionalStartDate?: string; // KKT regional variant start date
  regionalEndDate?: string; // KKT regional variant end date
  duration?: string; // e.g., "1 Minggu", "8 Minggu"
  type: ActivityType;
  programs?: string[]; // Applicable programs
  group?: 'A' | 'B'; // Group A (Foundation/Professional) or Group B (Pre-Diploma onwards)
  programType?: 'PreDiploma' | 'Diploma' | 'DiplomaPartTime' | 'Bachelor' | 'BachelorPartTime' | 'Master' | 'PhD'; // For Group B subdivision
  semua?: boolean; // True if applies to all Group B students (Semua Pelajar)
  states?: string[]; // Applicable states only (used for Kedah, Kelantan, Terengganu)
}

// Calendar data - single source of truth from calendar.json
import calendarData from "./calendar.json";

export type SessionId = string;

export const sessionOptions = (calendarData as { sessionOptions?: Array<{ id: string; label: string; group: "A" | "B" }> }).sessionOptions ?? [];
export const defaultSession: SessionId = (calendarData as { defaultSession?: string }).defaultSession ?? "A-20251";
export const programOptions = (calendarData as { programOptions: Array<{ label: string; value: string; group: "A" | "B" }> }).programOptions;

const sessionsData = (calendarData as { sessions?: Record<string, { activities: Activity[] }> }).sessions ?? {};

/** Get activities for a session. Returns empty array if session not found. */
export function getActivitiesForSession(sessionId: SessionId): Activity[] {
  const session = sessionsData[sessionId];
  return (session?.activities ?? []) as Activity[];
}

/** Get group from session ID (A-* = A, B-* = B). */
export function getGroupFromSession(sessionId: SessionId): ProgramGroup {
  return sessionId.startsWith("A-") ? "A" : "B";
}

/** Get default session for a group (first session in options for that group). */
export function getDefaultSessionForGroup(group: ProgramGroup): SessionId {
  const opt = sessionOptions.find((s) => s.group === group);
  return opt?.id ?? (group === "A" ? "A-20251" : "B-20263");
}

/** Get session date range from activities (min start, max end). */
function getSessionDateRange(sessionId: SessionId): { start: string; end: string } | null {
  const activities = getActivitiesForSession(sessionId);
  if (activities.length === 0) return null;
  let start = activities[0]!.startDate;
  let end = activities[0]!.endDate ?? activities[0]!.startDate;
  for (const a of activities) {
    if (a.startDate < start) start = a.startDate;
    const e = a.endDate ?? a.startDate;
    if (e > end) end = e;
  }
  return { start, end };
}

/** Get session for group that contains the given date (YYYY-MM-DD). Falls back to nearest future or last session. */
export function getSessionForCurrentDate(group: ProgramGroup, dateStr: string): SessionId {
  const opts = getSessionOptionsForGroup(group);
  if (opts.length === 0) return getDefaultSessionForGroup(group);

  // Find session that contains this date
  for (const s of opts) {
    const range = getSessionDateRange(s.id);
    if (range && dateStr >= range.start && dateStr <= range.end) return s.id;
  }

  // Find nearest future session
  const future = opts.find((s) => {
    const range = getSessionDateRange(s.id);
    return range && range.start > dateStr;
  });
  if (future) return future.id;

  // Fall back to last (most recent) session
  return opts[opts.length - 1]!.id;
}

/** Get session options for a group. */
export function getSessionOptionsForGroup(group: ProgramGroup) {
  return sessionOptions.filter((s) => s.group === group);
}

// Program badge config for list view - single source of truth for label and colors
export interface ProgramBadgeConfig {
  label: string;
  bgClass: string;
  textClass: string;
}

type ProgramTypeForBadge = NonNullable<Activity['programType']>;

const programBadgeConfigMap: Record<ProgramTypeForBadge, ProgramBadgeConfig> = {
  PreDiploma: {
    label: 'Pre-Diploma',
    bgClass: 'bg-[#D97706]/10 dark:bg-[#FBBF24]/10',
    textClass: 'text-[#D97706] dark:text-[#FBBF24]',
  },
  Diploma: {
    label: 'Diploma',
    bgClass: 'bg-[#0891B2]/10 dark:bg-[#22D3EE]/10',
    textClass: 'text-[#0891B2] dark:text-[#22D3EE]',
  },
  DiplomaPartTime: {
    label: 'Part-Time',
    bgClass: 'bg-[#65A30D]/10 dark:bg-[#A3E635]/10',
    textClass: 'text-[#65A30D] dark:text-[#A3E635]',
  },
  Bachelor: {
    label: 'Bachelor',
    bgClass: 'bg-[#DB2777]/10 dark:bg-[#F472B6]/10',
    textClass: 'text-[#DB2777] dark:text-[#F472B6]',
  },
  BachelorPartTime: {
    label: 'Part-Time',
    bgClass: 'bg-[#65A30D]/10 dark:bg-[#A3E635]/10',
    textClass: 'text-[#65A30D] dark:text-[#A3E635]',
  },
  Master: {
    label: 'Master',
    bgClass: 'bg-[#7C3AED]/10 dark:bg-[#A78BFA]/10',
    textClass: 'text-[#7C3AED] dark:text-[#C4B5FD]',
  },
  PhD: {
    label: 'PhD',
    bgClass: 'bg-[#BE123C]/10 dark:bg-[#FB7185]/10',
    textClass: 'text-[#BE123C] dark:text-[#FDA4AF]',
  },
};

const allStudentsBadgeConfig: ProgramBadgeConfig = {
  label: 'All Students',
  bgClass: 'bg-zinc-100 dark:bg-zinc-800',
  textClass: 'text-zinc-700 dark:text-zinc-200',
};

export function getProgramBadgeConfig(activity: Activity): ProgramBadgeConfig | null {
  if (activity.semua) return allStudentsBadgeConfig;
  if (activity.programType && activity.programType in programBadgeConfigMap) {
    return programBadgeConfigMap[activity.programType];
  }
  return null;
}

export type ProgramGroup = 'A' | 'B';

/**
 * Single source of truth for date matching.
 * When showKKT=true and activity has regional dates, use regional range only.
 * Otherwise use standard start/end dates.
 */
export function matchesActivityDate(
  activity: Activity,
  dateStr: string,
  showKKT: boolean
): boolean {
  const targetDate = new Date(dateStr);
  let startDate: Date;
  let endDate: Date;
  if (showKKT && activity.regionalStartDate) {
    startDate = new Date(activity.regionalStartDate);
    endDate = activity.regionalEndDate ? new Date(activity.regionalEndDate) : startDate;
  } else {
    startDate = new Date(activity.startDate);
    endDate = activity.endDate ? new Date(activity.endDate) : startDate;
  }
  return targetDate >= startDate && targetDate <= endDate;
}

export interface ActivityFilterOptions {
  selectedProgram: string;
  showRegistration?: boolean;
  showLecture?: boolean;
  showSemesterPendek?: boolean;
  showKuliahIntersesi?: boolean;
  showExamination?: boolean;
  showOthersExams?: boolean;
  showBreak?: boolean;
}

/**
 * Single source of truth for activity visibility based on filter toggles and program.
 */
export function shouldIncludeActivity(
  activity: Activity,
  filters: ActivityFilterOptions
): boolean {
  const {
    selectedProgram,
    showRegistration = true,
    showLecture = true,
    showSemesterPendek = true,
    showKuliahIntersesi = true,
    showExamination = true,
    showOthersExams = true,
    showBreak = true,
  } = filters;

  if (activity.type === 'registration' && !showRegistration) return false;
  if (activity.type === 'lecture' && !showLecture) return false;
  if (activity.type === 'examination' && !showExamination) return false;
  if (activity.type === 'break' && !showBreak) return false;

  if (activity.type === 'lecture' && activity.name.includes('Semester Pendek') && !showSemesterPendek) return false;
  if (activity.type === 'lecture' && activity.name.includes('Intersesi') && !showKuliahIntersesi) return false;
  if (activity.type === 'examination' && (activity.name.includes('Khas') || activity.name.includes('English Exit Test') || activity.name.includes('EET Lisan') || activity.name.includes('EET Speaking')) && !showOthersExams) return false;

  if (selectedProgram === 'All') return true;
  if (activity.programType && activity.programType !== selectedProgram) return false;
  return true;
}

/**
 * Get activities for a date, filtered and date-matched via shared helpers.
 * Single source for tooltip, day color, dots, ring/border.
 */
export function getActivitiesForDate(
  dateStr: string,
  sessionId: SessionId,
  showKKT: boolean,
  filters: ActivityFilterOptions
): Activity[] {
  const activities = getActivitiesForSession(sessionId);
  const group = getGroupFromSession(sessionId);
  return activities.filter(
    (a) =>
      a.group === group &&
      matchesActivityDate(a, dateStr, showKKT) &&
      shouldIncludeActivity(a, filters)
  );
}

// Get all activities for a specific month. When showKKT=true, consider regional dates for overlap.
export function getActivitiesForMonth(
  year: number,
  month: number,
  sessionId: SessionId,
  showKKT: boolean = false
): Activity[] {
  const activities = getActivitiesForSession(sessionId);
  const group = getGroupFromSession(sessionId);
  return activities.filter((activity) => {
    if (activity.group !== group) return false;

    let startDate: Date;
    let endDate: Date;
    if (showKKT && activity.regionalStartDate) {
      startDate = new Date(activity.regionalStartDate);
      endDate = activity.regionalEndDate ? new Date(activity.regionalEndDate) : startDate;
    } else {
      startDate = new Date(activity.startDate);
      endDate = activity.endDate ? new Date(activity.endDate) : startDate;
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    return startDate <= monthEnd && endDate >= monthStart;
  });
}

// Format date range in English
export function formatDateRange(startDate: string, endDate?: string): string {
  // Parse dates as UTC to ensure consistency between server and client
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  
  let end: Date;
  if (endDate) {
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  } else {
    end = start;
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (!endDate || startDate === endDate) {
    return `${start.getUTCDate()} ${monthNames[start.getUTCMonth()]}`;
  }
  
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()} - ${end.getUTCDate()} ${monthNames[end.getUTCMonth()]}`;
  }
  
  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()} ${monthNames[start.getUTCMonth()]} - ${end.getUTCDate()} ${monthNames[end.getUTCMonth()]}`;
  }
  
  return `${start.getUTCDate()} ${monthNames[start.getUTCMonth()]} ${start.getUTCFullYear()} - ${end.getUTCDate()} ${monthNames[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}

/** Days from today to activity start (UTC-normalized). Returns null if start is today or in the past. */
export function getDaysUntilStart(activity: Activity, todayStr: string, showKKT?: boolean): number | null {
  const startStr = showKKT && activity.regionalStartDate ? activity.regionalStartDate : activity.startDate;
  const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const today = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));
  const diffMs = start.getTime() - today.getTime();
  const days = Math.floor(diffMs / 86400000);
  return days > 0 ? days : null;
}

export function formatCountdown(days: number): string {
  return days === 1 ? 'In 1 day' : `In ${days} days`;
}

// Get months that should be displayed for a session based on available activities
export interface GetMonthsOptions {
  selectedProgram: string;
  showRegistration?: boolean;
  showLecture?: boolean;
  showExamination?: boolean;
  showOthersExams?: boolean;
  showBreak?: boolean;
  showSemesterPendek?: boolean;
  showKuliahIntersesi?: boolean;
  showKKT?: boolean;
}

export function getMonthsForGroup(
  sessionId: SessionId,
  options: GetMonthsOptions
): Array<{ month: number; year: number }> {
  const {
    selectedProgram,
    showRegistration = true,
    showLecture = true,
    showExamination = true,
    showOthersExams = true,
    showBreak = true,
    showSemesterPendek = true,
    showKuliahIntersesi = true,
    showKKT = false,
  } = options;

  const filters: ActivityFilterOptions = {
    selectedProgram,
    showRegistration,
    showLecture,
    showSemesterPendek,
    showKuliahIntersesi,
    showExamination,
    showOthersExams,
    showBreak,
  };

  const activities = getActivitiesForSession(sessionId);
  const group = getGroupFromSession(sessionId);
  const relevantDates: Date[] = [];

  for (const activity of activities) {
    if (activity.group !== group) continue;
    if (!shouldIncludeActivity(activity, filters)) continue;

    // Use regional dates if KKT filter is on and regional dates exist
    let startDate: Date;
    let endDate: Date;

    if (showKKT && activity.regionalStartDate) {
      startDate = new Date(activity.regionalStartDate);
      endDate = activity.regionalEndDate ? new Date(activity.regionalEndDate) : startDate;
    } else {
      startDate = new Date(activity.startDate);
      endDate = activity.endDate ? new Date(activity.endDate) : startDate;
    }

    relevantDates.push(startDate);
    relevantDates.push(endDate);
  }

  if (relevantDates.length === 0) {
    // Return default months if no activities found
    if (group === 'A') {
      return [
        { month: 12, year: 2025 },
        { month: 1, year: 2026 },
        { month: 2, year: 2026 },
        { month: 3, year: 2026 },
        { month: 4, year: 2026 },
        { month: 5, year: 2026 },
      ];
    } else {
      return [
        { month: 3, year: 2026 },
        { month: 4, year: 2026 },
        { month: 5, year: 2026 },
        { month: 6, year: 2026 },
        { month: 7, year: 2026 },
        { month: 8, year: 2026 },
      ];
    }
  }

  // Find min and max dates
  const minDate = new Date(Math.min(...relevantDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...relevantDates.map(d => d.getTime())));

  // Generate array of months from min to max
  const months: Array<{ month: number; year: number }> = [];
  const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (currentDate <= endMonth) {
    months.push({
      month: currentDate.getMonth() + 1, // JavaScript months are 0-indexed
      year: currentDate.getFullYear(),
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/** Stable dedupe key for activities. */
function getActivityDedupeKey(a: Activity): string {
  return [
    a.name,
    a.startDate,
    a.endDate ?? '',
    a.type,
    a.details ?? '',
    a.duration ?? '',
    a.regionalStartDate ?? '',
    a.regionalEndDate ?? '',
    a.programType ?? '',
  ].join('|');
}

/** Dedupe activities by stable key, preserving order. */
function dedupeActivities(activities: Activity[]): Activity[] {
  const seen = new Set<string>();
  return activities.filter((a) => {
    const key = getActivityDedupeKey(a);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Get months for multiple sessions (union, sorted ascending). */
export function getMonthsForSessions(
  sessionIds: SessionId[],
  options: GetMonthsOptions
): Array<{ month: number; year: number }> {
  if (sessionIds.length === 0) {
    const group = 'A';
    return group === 'A'
      ? [{ month: 12, year: 2025 }, { month: 1, year: 2026 }, { month: 2, year: 2026 }, { month: 3, year: 2026 }, { month: 4, year: 2026 }, { month: 5, year: 2026 }]
      : [{ month: 3, year: 2026 }, { month: 4, year: 2026 }, { month: 5, year: 2026 }, { month: 6, year: 2026 }, { month: 7, year: 2026 }, { month: 8, year: 2026 }];
  }
  const monthSet = new Set<string>();
  for (const sid of sessionIds) {
    const months = getMonthsForGroup(sid, options);
    for (const m of months) {
      monthSet.add(`${m.year}-${m.month}`);
    }
  }
  const months = Array.from(monthSet)
    .map((s) => {
      const [y, m] = s.split('-').map(Number);
      return { year: y!, month: m! };
    })
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  if (months.length === 0) {
    const group = getGroupFromSession(sessionIds[0]!);
    return group === 'A'
      ? [{ month: 12, year: 2025 }, { month: 1, year: 2026 }, { month: 2, year: 2026 }, { month: 3, year: 2026 }, { month: 4, year: 2026 }, { month: 5, year: 2026 }]
      : [{ month: 3, year: 2026 }, { month: 4, year: 2026 }, { month: 5, year: 2026 }, { month: 6, year: 2026 }, { month: 7, year: 2026 }, { month: 8, year: 2026 }];
  }
  return months;
}

/** Get activities for a date across multiple sessions (merged, deduped). */
export function getActivitiesForDateMultiSessions(
  dateStr: string,
  sessionIds: SessionId[],
  showKKT: boolean,
  filters: ActivityFilterOptions
): Activity[] {
  if (sessionIds.length === 0) return [];
  const all: Activity[] = [];
  for (const sid of sessionIds) {
    all.push(...getActivitiesForDate(dateStr, sid, showKKT, filters));
  }
  return dedupeActivities(all);
}

/** Get activities for a month across multiple sessions (merged, deduped). */
export function getActivitiesForMonthMultiSessions(
  year: number,
  month: number,
  sessionIds: SessionId[],
  showKKT: boolean = false
): Activity[] {
  if (sessionIds.length === 0) return [];
  const all: Activity[] = [];
  for (const sid of sessionIds) {
    all.push(...getActivitiesForMonth(year, month, sid, showKKT));
  }
  return dedupeActivities(all);
}

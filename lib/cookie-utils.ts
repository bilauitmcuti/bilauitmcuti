import { getSnapshot } from './calendar-store';
import {
  DEFAULT_FILTER_STATES,
  getDefaultSessionFallback,
} from './data';
import { isProgramValue, type ProgramValue } from './route-utils';

/** Prefer API defaultSession when store is hydrated; else static fallback (SSR-safe). */
function getDefaultSessionForCookie(): string {
  const d = getSnapshot().defaultSession;
  if (d) return d;
  return getDefaultSessionFallback();
}

export interface FilterStates {
  showKKT: boolean;
  showRegistration: boolean;
  showLecture: boolean;
  showSemesterPendek: boolean;
  showKuliahIntersesi: boolean;
  showExamination: boolean;
  showOthersExams: boolean;
  showBreak: boolean;
  showCountdown: boolean;
  sessionId?: string;
  sessionIds?: string[];
  sessionIdsByProgram?: Partial<Record<ProgramValue, string[]>>;
  /** Last selected program (used on `/` / `/list` refresh when URL does not encode one). */
  selectedProgram?: ProgramValue;
}

export const CALENDAR_FILTERS_COOKIE = 'calendar-filters';
export const CALENDAR_FILTERS_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

const COOKIE_NAME = CALENDAR_FILTERS_COOKIE;
const COOKIE_MAX_AGE = CALENDAR_FILTERS_MAX_AGE;

export function serializeFiltersCookieValue(filters: FilterStates): string {
  return encodeURIComponent(JSON.stringify(filters));
}

/** Read raw value of `calendar-filters` from `document.cookie` (client only). */
function getCalendarFiltersCookieRaw(): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return m?.[1] ?? null;
}

/**
 * Parse filter states from cookie value (decoded cookie value, not full cookie string).
 * @param defaultSessionWhenMissing — e.g. API `defaultSession` when parsing on the server before the client store exists.
 */
export function parseFiltersFromCookie(
  cookieValue: string | null | undefined,
  defaultSessionWhenMissing?: string
): FilterStates {
  const resolveDefaultSession = (): string =>
    defaultSessionWhenMissing ?? getDefaultSessionForCookie();

  if (!cookieValue) {
    return { ...DEFAULT_FILTER_STATES };
  }

  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded);
    const sessionIds = Array.isArray(parsed.sessionIds) && parsed.sessionIds.length > 0
      ? parsed.sessionIds
      : parsed.sessionId
        ? [parsed.sessionId]
        : [resolveDefaultSession()];
    const sessionIdsByProgram =
      parsed.sessionIdsByProgram && typeof parsed.sessionIdsByProgram === 'object'
        ? Object.fromEntries(
            Object.entries(parsed.sessionIdsByProgram)
              .filter(([, value]) => Array.isArray(value) && value.length > 0)
              .map(([key, value]) => [key, value as string[]])
          ) as Partial<Record<ProgramValue, string[]>>
        : undefined;
    const selectedProgram =
      typeof parsed.selectedProgram === 'string' && isProgramValue(parsed.selectedProgram)
        ? parsed.selectedProgram
        : undefined;
    return {
      showKKT: parsed.showKKT ?? DEFAULT_FILTER_STATES.showKKT,
      showRegistration: parsed.showRegistration ?? DEFAULT_FILTER_STATES.showRegistration,
      showLecture: parsed.showLecture ?? DEFAULT_FILTER_STATES.showLecture,
      showSemesterPendek: parsed.showSemesterPendek ?? DEFAULT_FILTER_STATES.showSemesterPendek,
      showKuliahIntersesi: parsed.showKuliahIntersesi ?? DEFAULT_FILTER_STATES.showKuliahIntersesi,
      showExamination: parsed.showExamination ?? DEFAULT_FILTER_STATES.showExamination,
      showOthersExams: parsed.showOthersExams ?? DEFAULT_FILTER_STATES.showOthersExams,
      showBreak: parsed.showBreak ?? DEFAULT_FILTER_STATES.showBreak,
      showCountdown: parsed.showCountdown ?? DEFAULT_FILTER_STATES.showCountdown,
      sessionId: sessionIds[0],
      sessionIds,
      sessionIdsByProgram,
      selectedProgram,
    };
  } catch {
    return {
      ...DEFAULT_FILTER_STATES,
      sessionId: resolveDefaultSession(),
      sessionIds: [resolveDefaultSession()],
    };
  }
}

/**
 * Set filter states to cookie (client-side only)
 */
export function setFiltersToCookie(filters: FilterStates): void {
  if (typeof window === 'undefined') return;

  try {
    const cookieValue = serializeFiltersCookieValue(filters);
    const expires = new Date();
    expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000);
    const securePart =
      process.env.NODE_ENV === "production" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${securePart}`;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to set filters cookie:", e);
    }
  }
}

/**
 * Get filter states from cookie (client-side only).
 * Reads the `calendar-filters` entry only — not the whole `document.cookie` string.
 */
export function getFiltersFromCookie(): FilterStates {
  if (typeof window === 'undefined') {
    return DEFAULT_FILTER_STATES;
  }

  const raw = getCalendarFiltersCookieRaw();
  return parseFiltersFromCookie(raw, getDefaultSessionFallback());
}

/**
 * Inline script body for root layout: sync filter toggles to cookie without wiping program/session fields.
 */
export function getCalendarFilterBootstrapScript(isProduction: boolean): string {
  const securePart = isProduction ? '"; Secure"' : '""';
  const defaultsJson = JSON.stringify({
    showKKT: DEFAULT_FILTER_STATES.showKKT,
    showRegistration: DEFAULT_FILTER_STATES.showRegistration,
    showLecture: DEFAULT_FILTER_STATES.showLecture,
    showSemesterPendek: DEFAULT_FILTER_STATES.showSemesterPendek,
    showKuliahIntersesi: DEFAULT_FILTER_STATES.showKuliahIntersesi,
    showExamination: DEFAULT_FILTER_STATES.showExamination,
    showOthersExams: DEFAULT_FILTER_STATES.showOthersExams,
    showBreak: DEFAULT_FILTER_STATES.showBreak,
    showCountdown: DEFAULT_FILTER_STATES.showCountdown,
  });

  return `
                const DEFAULT_FILTER_STATES = ${defaultsJson};

                function readExistingCalendarFiltersCookie() {
                  try {
                    var parts = document.cookie.split(';');
                    for (var i = 0; i < parts.length; i++) {
                      var part = parts[i].trim();
                      if (part.indexOf('calendar-filters=') === 0) {
                        var raw = part.slice('calendar-filters='.length);
                        try { raw = decodeURIComponent(raw); } catch (e) {}
                        var parsed = JSON.parse(raw);
                        return parsed && typeof parsed === 'object' ? parsed : null;
                      }
                    }
                    return null;
                  } catch (e) {
                    return null;
                  }
                }

                function mergeFilterTogglesIntoCookie(existing, toggles) {
                  var base = existing && typeof existing === 'object' ? Object.assign({}, existing) : {};
                  return Object.assign(base, toggles);
                }

                try {
                  const filterValues = {
                    showRegistration: JSON.parse(localStorage.getItem('showRegistration') ?? JSON.stringify(DEFAULT_FILTER_STATES.showRegistration)),
                    showLecture: JSON.parse(localStorage.getItem('showLecture') ?? JSON.stringify(DEFAULT_FILTER_STATES.showLecture)),
                    showSemesterPendek: JSON.parse(localStorage.getItem('showSemesterPendek') ?? JSON.stringify(DEFAULT_FILTER_STATES.showSemesterPendek)),
                    showKuliahIntersesi: JSON.parse(localStorage.getItem('showKuliahIntersesi') ?? JSON.stringify(DEFAULT_FILTER_STATES.showKuliahIntersesi)),
                    showExamination: JSON.parse(localStorage.getItem('showExamination') ?? JSON.stringify(DEFAULT_FILTER_STATES.showExamination)),
                    showOthersExams: JSON.parse(localStorage.getItem('showOthersExams') ?? JSON.stringify(DEFAULT_FILTER_STATES.showOthersExams)),
                    showBreak: JSON.parse(localStorage.getItem('showBreak') ?? JSON.stringify(DEFAULT_FILTER_STATES.showBreak)),
                    showKKT: JSON.parse(localStorage.getItem('showKKT') ?? JSON.stringify(DEFAULT_FILTER_STATES.showKKT)),
                    showCountdown: JSON.parse(localStorage.getItem('showCountdown') ?? JSON.stringify(DEFAULT_FILTER_STATES.showCountdown)),
                  };

                  var existingCookie = readExistingCalendarFiltersCookie();
                  var mergedCookie = mergeFilterTogglesIntoCookie(existingCookie, filterValues);

                  if (!mergedCookie.selectedProgram) {
                    try {
                      var sp = localStorage.getItem('selectedProgram');
                      if (sp) mergedCookie.selectedProgram = sp;
                    } catch (e) {}
                  }
                  if (!mergedCookie.sessionIdsByProgram) {
                    try {
                      var rawMap = localStorage.getItem('sessionIdsByProgram');
                      if (rawMap) mergedCookie.sessionIdsByProgram = JSON.parse(rawMap);
                    } catch (e) {}
                  }
                  if (!mergedCookie.sessionIds && !mergedCookie.sessionId && mergedCookie.sessionIdsByProgram) {
                    try {
                      var prog = mergedCookie.selectedProgram || 'All';
                      var map = mergedCookie.sessionIdsByProgram;
                      if (map && map[prog] && map[prog].length) {
                        mergedCookie.sessionIds = map[prog];
                        mergedCookie.sessionId = map[prog][0];
                      }
                    } catch (e) {}
                  }

                  try {
                    const cookieValue = encodeURIComponent(JSON.stringify(mergedCookie));
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
                    const securePart = ${securePart};
                    document.cookie = 'calendar-filters=' + cookieValue + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax' + securePart;
                  } catch (cookieError) {
                    if (isDev) console.warn('Failed to sync filters to cookie:', cookieError);
                  }

                  const filters = {
                    showRegistration: JSON.stringify(filterValues.showRegistration),
                    showLecture: JSON.stringify(filterValues.showLecture),
                    showSemesterPendek: JSON.stringify(filterValues.showSemesterPendek),
                    showKuliahIntersesi: JSON.stringify(filterValues.showKuliahIntersesi),
                    showExamination: JSON.stringify(filterValues.showExamination),
                    showOthersExams: JSON.stringify(filterValues.showOthersExams),
                    showBreak: JSON.stringify(filterValues.showBreak),
                    showKKT: JSON.stringify(filterValues.showKKT),
                  };
                  document.documentElement.setAttribute('data-filters', JSON.stringify(filters));
                } catch (e) {
                  const defaultFilters = {
                    showRegistration: JSON.stringify(DEFAULT_FILTER_STATES.showRegistration),
                    showLecture: JSON.stringify(DEFAULT_FILTER_STATES.showLecture),
                    showSemesterPendek: JSON.stringify(DEFAULT_FILTER_STATES.showSemesterPendek),
                    showKuliahIntersesi: JSON.stringify(DEFAULT_FILTER_STATES.showKuliahIntersesi),
                    showExamination: JSON.stringify(DEFAULT_FILTER_STATES.showExamination),
                    showOthersExams: JSON.stringify(DEFAULT_FILTER_STATES.showOthersExams),
                    showBreak: JSON.stringify(DEFAULT_FILTER_STATES.showBreak),
                    showKKT: JSON.stringify(DEFAULT_FILTER_STATES.showKKT),
                  };
                  document.documentElement.setAttribute('data-filters', JSON.stringify(defaultFilters));
                }`;
}

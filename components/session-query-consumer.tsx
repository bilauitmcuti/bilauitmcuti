"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getFiltersFromCookie,
  setFiltersToCookie,
  type FilterStates,
} from "@/lib/cookie-utils";
import { resolveSessionsForProgram } from "@/lib/calendar-session-resolve";
import { getSnapshot } from "@/lib/calendar-store";
import type { SessionId } from "@/lib/data";
import {
  applyFilterKeysToFilters,
  buildCalendarQueryString,
  hasFilterQueryParams,
  parseFilterKeysFromSearchParams,
} from "@/lib/filter-query";
import {
  applySessionIdsToFilters,
  hasSessionQueryParams,
  isHomepageCalendarPath,
  normalizeSessionIdsForProgram,
  parseSessionIdsFromSearchParams,
  resolveProgramForSessionQuery,
} from "@/lib/session-query";
import type { ProgramValue } from "@/lib/route-utils";
import { getRoutePath } from "@/lib/route-utils";

interface SessionQueryConsumerProps {
  onSessionQueryConsumed: (program: ProgramValue, sessionIds: SessionId[]) => void;
  onFilterQueryConsumed?: (filters: FilterStates) => void;
}

export function SessionQueryConsumer({
  onSessionQueryConsumed,
  onFilterQueryConsumed,
}: SessionQueryConsumerProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const consumedKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const hasSessions = hasSessionQueryParams(searchParams);
    const hasFilters = hasFilterQueryParams(searchParams);
    if (!hasSessions && !hasFilters) return;

    const sessionIds = hasSessions
      ? parseSessionIdsFromSearchParams(searchParams)
      : [];
    const filterKeys = hasFilters
      ? parseFilterKeysFromSearchParams(searchParams)
      : [];

    if (hasSessions && sessionIds.length === 0) return;
    if (hasFilters && filterKeys.length === 0) return;

    const consumeKey = `${pathname}?${buildCalendarQueryString({
      sessionIds,
      filterKeys,
    })}`;
    if (consumedKeyRef.current === consumeKey) return;
    consumedKeyRef.current = consumeKey;

    const existing = getFiltersFromCookie();
    let merged = existing;
    let program: ProgramValue | undefined;
    let sessionsToApply: SessionId[] = [];

    if (hasSessions) {
      program = resolveProgramForSessionQuery(
        pathname,
        sessionIds,
        existing.selectedProgram
      );
      const normalized = normalizeSessionIdsForProgram(sessionIds, program);
      if (normalized.length === 0) {
        // Filter-only still applies below; skip session merge when invalid.
        program = undefined;
      } else {
        sessionsToApply = normalized;
        const snap = getSnapshot();
        if (snap.sessionOptions.length > 0) {
          const dateStr = new Date().toISOString().slice(0, 10);
          sessionsToApply = resolveSessionsForProgram({
            meta: {
              defaultSession: snap.defaultSession,
              sessionOptions: snap.sessionOptions,
              programOptions: snap.programOptions,
            },
            program,
            candidates: normalized,
            dateStr,
          }).sessions;
        }

        if (sessionsToApply.length === 0) {
          program = undefined;
        } else {
          merged = applySessionIdsToFilters(existing, sessionsToApply, program);
        }
      }
    }

    if (hasFilters) {
      merged = applyFilterKeysToFilters(merged, filterKeys);
    }

    // Nothing useful to apply (invalid session-only query).
    if (!hasFilters && sessionsToApply.length === 0) return;

    setFiltersToCookie(merged);
    try {
      if (merged.sessionIdsByProgram) {
        localStorage.setItem(
          "sessionIdsByProgram",
          JSON.stringify(merged.sessionIdsByProgram)
        );
      }
      if (program) {
        localStorage.setItem("selectedProgram", program);
      }
      localStorage.setItem("showKKT", JSON.stringify(merged.showKKT));
      localStorage.setItem("showRegistration", JSON.stringify(merged.showRegistration));
      localStorage.setItem("showLecture", JSON.stringify(merged.showLecture));
      localStorage.setItem(
        "showSemesterPendek",
        JSON.stringify(merged.showSemesterPendek)
      );
      localStorage.setItem(
        "showKuliahIntersesi",
        JSON.stringify(merged.showKuliahIntersesi)
      );
      localStorage.setItem("showExamination", JSON.stringify(merged.showExamination));
      localStorage.setItem("showOthersExams", JSON.stringify(merged.showOthersExams));
      localStorage.setItem("showBreak", JSON.stringify(merged.showBreak));
    } catch {
      // Ignore storage errors (private mode / quota).
    }

    if (program && sessionsToApply.length > 0) {
      onSessionQueryConsumed(program, sessionsToApply);
    }
    if (hasFilters) {
      onFilterQueryConsumed?.(merged);
    }

    if (isHomepageCalendarPath(pathname) && program && program !== "All") {
      router.replace(
        getRoutePath(program, pathname === "/list" ? "list" : "grid"),
        { scroll: false }
      );
      return;
    }
    router.replace(pathname, { scroll: false });
  }, [
    searchParams,
    pathname,
    router,
    onSessionQueryConsumed,
    onFilterQueryConsumed,
  ]);

  return null;
}

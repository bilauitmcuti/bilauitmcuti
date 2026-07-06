import { getGroupFromSession, getSessionForCurrentDate, type SessionId } from "@/lib/data";
import { isGroupASessionId } from "@/lib/group-a-sessions";
import { getSnapshot } from "@/lib/calendar-store";
import { resolveSessionsForProgram } from "@/lib/calendar-session-resolve";
import type { ProgramValue } from "@/lib/route-utils";

export function getGroupFromProgram(program: ProgramValue): "A" | "B" {
  return program === "Foundation/Professional" ? "A" : "B";
}

export function getSessionMemoryKey(program: ProgramValue): ProgramValue {
  return getGroupFromProgram(program) === "B" ? "All" : program;
}

export function normalizeSessionsForGroup(
  sessionIds: SessionId[],
  group: "A" | "B"
): SessionId[] {
  const unique = Array.from(new Set(sessionIds));
  if (group === "A") {
    return unique.filter((id) => isGroupASessionId(id));
  }
  return unique.filter((id) => getGroupFromSession(id) === "B");
}

export function areSessionListsEqual(left: SessionId[], right: SessionId[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((id, index) => right[index] === id);
}

/** Resolve valid session ids for a program using store meta + per-program memory. */
export function resolveProgramSessionsForStore(
  program: ProgramValue,
  candidates: SessionId[],
  sessionsByProgram: Partial<Record<ProgramValue, SessionId[]>>,
  dateStr: string
): SessionId[] {
  const targetGroup = getGroupFromProgram(program);
  const sessionMemoryKey = getSessionMemoryKey(program);
  const normalizedCandidates = normalizeSessionsForGroup(candidates, targetGroup);
  const fromMemory = normalizeSessionsForGroup(
    sessionsByProgram[sessionMemoryKey] ?? [],
    targetGroup
  );
  const merged = normalizedCandidates.length > 0 ? normalizedCandidates : fromMemory;
  const snap = getSnapshot();

  if (snap.sessionOptions.length > 0) {
    return resolveSessionsForProgram({
      meta: {
        defaultSession: snap.defaultSession,
        sessionOptions: snap.sessionOptions,
        programOptions: snap.programOptions,
      },
      program,
      candidates: merged,
      dateStr,
    }).sessions;
  }

  if (merged.length > 0) return merged;
  return [getSessionForCurrentDate(targetGroup, dateStr)];
}

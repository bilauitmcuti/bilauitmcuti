import { describe, expect, it } from "vitest";
import { getDefaultSessionForGroup } from "@/lib/data";
import { GROUP_A_DEFAULT_SESSION_ID } from "@/lib/group-a-sessions";
import { assignCalendarStoreSnapshot, EMPTY_CALENDAR_SNAPSHOT } from "@/lib/calendar-store";
import {
  areSessionListsEqual,
  getGroupFromProgram,
  getSessionMemoryKey,
  normalizeSessionsForGroup,
  resolveProgramSessionsForStore,
} from "@/lib/session-memory";

describe("session-memory", () => {
  it("maps Foundation/Professional to group A", () => {
    expect(getGroupFromProgram("Foundation/Professional")).toBe("A");
    expect(getGroupFromProgram("All")).toBe("B");
  });

  it("uses All as session memory key for group B programs", () => {
    expect(getSessionMemoryKey("Diploma")).toBe("All");
    expect(getSessionMemoryKey("Foundation/Professional")).toBe("Foundation/Professional");
  });

  it("filters sessions by group prefix", () => {
    expect(normalizeSessionsForGroup(["A-20251", "B-20263"], "A")).toEqual([]);
    expect(normalizeSessionsForGroup(["A-20251", "B-20263"], "B")).toEqual(["B-20263"]);
  });

  it("compares session lists in order", () => {
    expect(areSessionListsEqual(["A-20251"], ["A-20251"])).toBe(true);
    expect(areSessionListsEqual(["A-20251", "B-20263"], ["B-20263", "A-20251"])).toBe(false);
  });

  it("resolves Group A sessions when switching from Group B candidates", () => {
    assignCalendarStoreSnapshot({
      ...EMPTY_CALENDAR_SNAPSHOT,
      version: 1,
      sessionOptions: [
        { id: "A-20264", label: "A", group: "A" },
        { id: "B-20263", label: "B", group: "B" },
      ],
      defaultSession: "B-20263",
    });

    const sessions = resolveProgramSessionsForStore(
      "Foundation/Professional",
      ["B-20263"],
      { All: ["B-20263"] },
      "2026-03-15"
    );

    expect(sessions).toEqual(["A-20264"]);
  });

  it("defaults Group A to configured session when meta is empty", () => {
    assignCalendarStoreSnapshot({ ...EMPTY_CALENDAR_SNAPSHOT, sessions: {} });
    expect(getDefaultSessionForGroup("A")).toBe(GROUP_A_DEFAULT_SESSION_ID);
    expect(getDefaultSessionForGroup("B")).toBe("B-20263");
  });
});

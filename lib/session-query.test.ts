import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  buildCalendarAbsoluteUrl,
  buildCalendarUrlPath,
  buildSessionQueryString,
  CHAT_RETURN_CONTEXT_KEY,
  parseSessionIdsFromSearchParams,
  resolveChatReturnPath,
  resolveCleanCalendarPath,
  resolveProgramForSessionQuery,
} from "./session-query";

describe("session query URL helpers", () => {
  it("builds bare session query keys", () => {
    expect(buildSessionQueryString(["B-20263", "A-20251"])).toBe("B-20263&A-20251");
    expect(buildSessionQueryString([])).toBe("");
  });

  it("builds calendar paths with session query", () => {
    expect(buildCalendarUrlPath("/diploma", ["B-20263"])).toBe("/diploma?B-20263");
    expect(buildCalendarUrlPath("/list", ["B-20263"])).toBe("/list?B-20263");
    expect(buildCalendarUrlPath("/", ["B-20263"])).toBe("/?B-20263");
    expect(buildCalendarUrlPath("/diploma", [])).toBe("/diploma");
  });

  it("builds absolute og/share URLs", () => {
    expect(buildCalendarAbsoluteUrl("/diploma", ["B-20263"])).toBe(
      "https://bilauitmcuti.com/diploma?B-20263"
    );
    expect(buildCalendarAbsoluteUrl("/diploma/list", ["B-20263"])).toBe(
      "https://bilauitmcuti.com/diploma/list?B-20263"
    );
    expect(buildCalendarAbsoluteUrl("/", [])).toBe("https://bilauitmcuti.com");
    expect(buildCalendarAbsoluteUrl("/", ["B-20263"])).toBe(
      "https://bilauitmcuti.com/?B-20263"
    );
  });

  it("round-trips session ids from search params and ignores unknown Group A ids", () => {
    const params = new URLSearchParams("B-20263&A-20251");
    expect(parseSessionIdsFromSearchParams(params)).toEqual(["B-20263"]);
  });

  it("homepage session query ignores cookie Foundation and uses All for Group B", () => {
    expect(
      resolveProgramForSessionQuery("/", ["B-20263"], "Foundation/Professional")
    ).toBe("All");
    expect(resolveProgramForSessionQuery("/list", ["B-20263"], "Foundation/Professional")).toBe(
      "All"
    );
  });

  it("homepage session query ignores unknown Group A session ids", () => {
    expect(resolveProgramForSessionQuery("/", ["A-20251"], "All")).toBe("All");
  });

  it("program route wins over cookie for session query", () => {
    expect(
      resolveProgramForSessionQuery("/diploma", ["B-20263"], "Foundation/Professional")
    ).toBe("Diploma");
  });

  it("resolves clean calendar path for program routes", () => {
    expect(
      resolveCleanCalendarPath("/", "Foundation/Professional", "grid")
    ).toBe("/foundation-professional");
    expect(resolveCleanCalendarPath("/", "All", "grid")).toBe("/");
  });
});

describe("resolveChatReturnPath", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setReturnPath(returnPath: unknown) {
    store.set(
      CHAT_RETURN_CONTEXT_KEY,
      JSON.stringify({
        selectedProgram: "All",
        selectedSessions: ["B-20263"],
        returnPath,
      })
    );
  }

  it("returns valid calendar paths", () => {
    setReturnPath("/list");
    expect(resolveChatReturnPath()).toBe("/list");

    setReturnPath("/diploma/list");
    expect(resolveChatReturnPath()).toBe("/diploma/list");
  });

  it("falls back to / when missing, corrupt, or invalid", () => {
    expect(resolveChatReturnPath()).toBe("/");

    store.set(CHAT_RETURN_CONTEXT_KEY, "{not-json");
    expect(resolveChatReturnPath()).toBe("/");

    setReturnPath("/chat");
    expect(resolveChatReturnPath()).toBe("/");

    setReturnPath("/api/v1/calendar");
    expect(resolveChatReturnPath()).toBe("/");

    setReturnPath("https://evil.com/list");
    expect(resolveChatReturnPath()).toBe("/");
  });
});

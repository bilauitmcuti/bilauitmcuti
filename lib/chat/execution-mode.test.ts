import { describe, expect, it } from "vitest";
import {
  resolveChatExecutionMode,
  shouldPreferSingleStream,
} from "@/lib/chat/handler";
import { MAX_AGENT_TOOL_STEPS } from "@/lib/chat/agent/types";

describe("resolveChatExecutionMode", () => {
  it("uses single_stream when agent tools path is disabled (dev Llama)", () => {
    expect(resolveChatExecutionMode({ isAgentToolsPath: false })).toBe("single_stream");
  });

  it("uses agent on Gemma tools path for complex turns", () => {
    expect(resolveChatExecutionMode({ isAgentToolsPath: true })).toBe("agent");
  });

  it("short-circuits matched or simple turns to single_stream on tools path", () => {
    expect(
      resolveChatExecutionMode({
        isAgentToolsPath: true,
        preferSingleStream: true,
      })
    ).toBe("single_stream");
  });

  it("is deterministic — same inputs always yield the same mode", () => {
    const input = { isAgentToolsPath: true, preferSingleStream: false };
    expect(resolveChatExecutionMode(input)).toBe(resolveChatExecutionMode(input));
    expect(resolveChatExecutionMode(input)).toBe("agent");
  });
});

describe("shouldPreferSingleStream", () => {
  it("prefers single_stream for matched activities", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: true,
        isSimple: false,
        topics: ["academic_calendar"],
      })
    ).toBe(true);
  });

  it("prefers single_stream for simple date questions", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: true,
        topics: ["academic_calendar"],
      })
    ).toBe(true);
  });

  it("prefers single_stream for calendar-only topics including long academic questions", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["academic_calendar"],
      })
    ).toBe(true);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["lecture_weeks"],
      })
    ).toBe(true);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["public_holiday"],
      })
    ).toBe(true);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["lecture_weeks", "public_holiday"],
      })
    ).toBe(true);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["academic_calendar", "lecture_weeks"],
      })
    ).toBe(true);
  });

  it("prefers single_stream for uitm_general topics", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["uitm_general"],
      })
    ).toBe(true);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["academic_calendar", "uitm_general"],
      })
    ).toBe(true);
  });

  it("uses agent only when no topics are routed", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: [],
      })
    ).toBe(false);
  });
});

describe("appendReasoningLine", () => {
  it("joins status lines without duplicating and caps count", async () => {
    const { appendReasoningLine, MAX_REASONING_LINES } = await import("@/lib/chat/handler");
    let text = appendReasoningLine("", "Checking academic calendar");
    text = appendReasoningLine(text, "Finding week dates");
    text = appendReasoningLine(text, "Checking public holidays");
    expect(text).toContain("Checking academic calendar");
    expect(text).toContain("Finding week dates");
    expect(appendReasoningLine(text, "Checking academic calendar")).toBe(text);

    for (let i = 0; i < 4; i++) {
      text = appendReasoningLine(text, `Extra step ${i}`);
    }
    expect(text.split("\n").filter(Boolean).length).toBe(MAX_REASONING_LINES);
  });
});

describe("MAX_AGENT_TOOL_STEPS", () => {
  it("caps tool steps at 2 for agent fallback turns", () => {
    expect(MAX_AGENT_TOOL_STEPS).toBe(2);
  });
});

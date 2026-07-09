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

  it("short-circuits matched activity turns to single_stream on tools path", () => {
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
  it("prefers single_stream only for matched activities", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: true,
        isSimple: false,
        topics: ["academic_calendar"],
      })
    ).toBe(true);
  });

  it("uses agent for simple date questions without a matched activity", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: true,
        topics: ["academic_calendar"],
      })
    ).toBe(false);
  });

  it("uses agent for calendar-only topics without a matched activity", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["academic_calendar"],
      })
    ).toBe(false);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["lecture_weeks", "public_holiday"],
      })
    ).toBe(false);
  });

  it("uses agent when uitm_general is involved without a matched activity", () => {
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["uitm_general"],
      })
    ).toBe(false);
    expect(
      shouldPreferSingleStream({
        hasMatchedActivity: false,
        isSimple: false,
        topics: ["academic_calendar", "uitm_general"],
      })
    ).toBe(false);
  });
});

describe("MAX_AGENT_TOOL_STEPS", () => {
  it("caps tool steps at 4 for complex production Gemma turns", () => {
    expect(MAX_AGENT_TOOL_STEPS).toBe(4);
  });
});

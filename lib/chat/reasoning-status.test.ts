import { describe, expect, it } from "vitest";
import {
  buildReasoningOpener,
  buildToolReasoningLine,
  truncateForReasoning,
} from "@/lib/chat/reasoning-status";

describe("reasoning-status", () => {
  it("truncates long user messages for display", () => {
    const long = "a".repeat(100);
    expect(truncateForReasoning(long).length).toBeLessThanOrEqual(72);
    expect(truncateForReasoning(long).endsWith("…")).toBe(true);
  });

  it("builds opener from user question and lecture weeks topic", () => {
    const line = buildReasoningOpener({
      message: "minggu kuliah 5 bila?",
      topics: ["lecture_weeks"],
      hasMatchedActivity: false,
      activityMatches: [],
      programLabel: "Diploma",
      sessionCount: 1,
    });
    expect(line).toContain("minggu kuliah 5");
    expect(line).toMatch(/minggu kuliah|lecture week/i);
  });

  it("builds tool line with user snippet", () => {
    const line = buildToolReasoningLine("get_public_holidays", {
      message: "cuti umum 2027",
      programLabel: "All",
      activityMatches: [],
    });
    expect(line).toMatch(/cuti umum|public holiday/i);
  });
});

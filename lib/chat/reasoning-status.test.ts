import { describe, expect, it } from "vitest";
import {
  appendReasoningLine,
  buildReasoningOpener,
  buildRetryReasoningLine,
  buildToolReasoningLine,
  MAX_REASONING_VERSES,
  pickProgressPhrase,
  parseReasoningVerses,
} from "@/lib/chat/reasoning-status";

const FORBIDDEN = /\b(function calling|tool calls?|rag\b|embeddings?|vector search|loading data|internal apis?|composing answer|chain of thought|reasoning process|prefetch)\b/i;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function expectShortFriendlyPhrase(line: string) {
  expect(line.trim().length).toBeGreaterThan(0);
  expect(wordCount(line)).toBeGreaterThanOrEqual(2);
  expect(wordCount(line)).toBeLessThanOrEqual(6);
  expect(line).not.toMatch(FORBIDDEN);
}

describe("reasoning-status", () => {
  it("builds short lecture-week opener without user snippet", () => {
    const line = buildReasoningOpener({
      message: "minggu kuliah 5 bila?",
      topics: ["lecture_weeks"],
      hasMatchedActivity: false,
      activityMatches: [],
      programLabel: "Diploma",
      sessionCount: 1,
    });
    expectShortFriendlyPhrase(line);
    expect(line).not.toContain("minggu kuliah 5");
  });

  it("builds short public-holiday tool progress", () => {
    const line = buildToolReasoningLine("get_public_holidays", {
      message: "cuti umum 2027",
    });
    expectShortFriendlyPhrase(line);
    expect(line).toMatch(/cuti|holiday/i);
  });

  it("varies phrasing by message seed", () => {
    const a = buildReasoningOpener({
      message: "bila cuti semester?",
      topics: ["academic_calendar"],
      hasMatchedActivity: false,
      activityMatches: [],
      programLabel: "All",
      sessionCount: 1,
    });
    const b = buildReasoningOpener({
      message: "when does semester break start for diploma?",
      topics: ["academic_calendar"],
      hasMatchedActivity: false,
      activityMatches: [],
      programLabel: "Diploma",
      sessionCount: 1,
    });
    expectShortFriendlyPhrase(a);
    expectShortFriendlyPhrase(b);
    expect(a).not.toBe(b);
  });

  it("caps visible progress verses per response", () => {
    let text = "";
    for (let i = 0; i < 7; i++) {
      text = appendReasoningLine(text, `Step number ${i + 1}`);
    }
    expect(parseReasoningVerses(text).length).toBe(MAX_REASONING_VERSES);
  });

  it("deduplicates identical progress lines", () => {
    let text = appendReasoningLine("", "Checking lecture weeks");
    text = appendReasoningLine(text, "Finding week dates");
    expect(appendReasoningLine(text, "Checking lecture weeks")).toBe(text);
  });

  it("builds short retry progress", () => {
    expectShortFriendlyPhrase(buildRetryReasoningLine("dates", "bila cuti?"));
    expectShortFriendlyPhrase(buildRetryReasoningLine("incomplete", "explain uitm fees"));
  });

  it("parseReasoningVerses returns bullet-ready points capped at five", () => {
    const text = [
      "Checking lecture weeks",
      "Finding week dates",
      "Checking public holidays",
      "Looking up UiTM info",
      "Reviewing session dates",
      "Should not appear",
    ].join("\n");
    expect(parseReasoningVerses(text)).toEqual([
      "Checking lecture weeks",
      "Finding week dates",
      "Checking public holidays",
      "Looking up UiTM info",
      "Reviewing session dates",
    ]);
  });

  it("pickProgressPhrase is deterministic for the same seed", () => {
    const pool = ["Checking lecture weeks", "Finding week dates", "Looking up weeks"] as const;
    expect(pickProgressPhrase(pool, "seed-a")).toBe(pickProgressPhrase(pool, "seed-a"));
    expect(pickProgressPhrase(pool, "seed-b")).toBe(pickProgressPhrase(pool, "seed-b"));
  });
});

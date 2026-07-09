import { describe, expect, it } from "vitest";
import {
  buildReasoningOpener,
  buildReasoningParagraph,
  buildRetryStatusLine,
  MAX_REASONING_WORDS,
  MIN_REASONING_WORDS,
  pickProgressPhrase,
  replaceReasoningParagraph,
  wordCount,
} from "@/lib/chat/reasoning-status";
import type { ChatTopic } from "@/lib/chat/topic-router";

const FORBIDDEN =
  /\b(function calling|tool calls?|rag\b|embeddings?|vector search|loading data|internal apis?|composing answer|chain of thought|reasoning process|prefetch|prompts?)\b/i;

const TOPICS: ChatTopic[] = [
  "academic_calendar",
  "lecture_weeks",
  "public_holiday",
  "uitm_general",
];

function expectParagraph(paragraph: string) {
  expect(paragraph.trim().length).toBeGreaterThan(0);
  expect(wordCount(paragraph)).toBeGreaterThanOrEqual(MIN_REASONING_WORDS);
  expect(wordCount(paragraph)).toBeLessThanOrEqual(MAX_REASONING_WORDS);
  expect(paragraph).not.toMatch(FORBIDDEN);
}

describe("reasoning-status", () => {
  it("builds a start paragraph for lecture weeks without quoting the user", () => {
    const paragraph = buildReasoningOpener({
      message: "minggu kuliah 5 bila?",
      topics: ["lecture_weeks"],
      hasMatchedActivity: false,
      activityMatches: [],
      programLabel: "Diploma",
      sessionCount: 1,
    });
    expectParagraph(paragraph);
    expect(paragraph).not.toContain("minggu kuliah 5");
    expect(paragraph).toMatch(/lecture week|minggu kuliah/i);
  });

  it("builds progress and final paragraphs for public holidays", () => {
    const base = {
      message: "cuti umum 2027",
      topics: ["public_holiday"] as ChatTopic[],
      programLabel: "All",
      sessionCount: 1,
      hasMatchedActivity: false,
      activityMatches: [],
    };
    expectParagraph(buildReasoningParagraph({ ...base, phase: "start" }));
    expectParagraph(buildReasoningParagraph({ ...base, phase: "progress" }));
    expectParagraph(buildReasoningParagraph({ ...base, phase: "final" }));
  });

  it("covers student-focused UiTM questions", () => {
    const paragraph = buildReasoningParagraph({
      message: "berapa yuran pelajar diploma uitm?",
      phase: "start",
      topics: ["uitm_general"],
      programLabel: "Diploma",
      sessionCount: 1,
      hasMatchedActivity: false,
      activityMatches: [],
    });
    expectParagraph(paragraph);
    expect(paragraph).toMatch(/student|pelajar|UiTM/i);
  });

  it("varies phrasing by message seed", () => {
    const a = buildReasoningParagraph({
      message: "bila cuti semester?",
      phase: "start",
      topics: ["academic_calendar"],
      programLabel: "All",
      sessionCount: 1,
      hasMatchedActivity: false,
      activityMatches: [],
    });
    const b = buildReasoningParagraph({
      message: "when does semester break start for diploma?",
      phase: "start",
      topics: ["academic_calendar"],
      programLabel: "Diploma",
      sessionCount: 1,
      hasMatchedActivity: false,
      activityMatches: [],
    });
    expectParagraph(a);
    expectParagraph(b);
    expect(a).not.toBe(b);
  });

  it("replaces the paragraph instead of appending", () => {
    const first = "Checking the official UiTM academic calendar for the Diploma programme to find the correct semester and confirm the dates before preparing your answer.";
    const second = "Everything has been verified. I'm preparing a clear and accurate answer based on the latest official information.";
    expect(replaceReasoningParagraph(first, second)).toBe(second);
    expect(replaceReasoningParagraph(second, second)).toBe(second);
  });

  it("pickProgressPhrase is deterministic for the same seed", () => {
    const pool = [
      "Checking the official UiTM academic calendar for {program} to find the correct semester and confirm the dates before preparing your answer.",
      "I'm reviewing the official UiTM academic calendar for {program} students to locate the right semester and verify the dates before I answer.",
    ] as const;
    expect(pickProgressPhrase(pool, "seed-a")).toBe(pickProgressPhrase(pool, "seed-a"));
    expect(pickProgressPhrase(pool, "seed-b")).toBe(pickProgressPhrase(pool, "seed-b"));
  });

  it("builds retry paragraphs within the word range", () => {
    const paragraph = buildReasoningParagraph({
      message: "bila cuti?",
      phase: "retry",
      topics: ["academic_calendar"],
      programLabel: "All",
      sessionCount: 1,
      hasMatchedActivity: false,
      activityMatches: [],
      retryReason: "dates",
    });
    expectParagraph(paragraph);
  });

  it("includes program context for multi-session comparisons", () => {
    const paragraph = buildReasoningParagraph({
      message: "compare session dates",
      phase: "start",
      topics: ["academic_calendar"],
      programLabel: "Degree",
      sessionCount: 3,
      hasMatchedActivity: false,
      activityMatches: [],
    });
    expectParagraph(paragraph);
    expect(paragraph).toMatch(/session|sesi/i);
  });

  it("builds short retry status lines by language and reason", () => {
    const datesEn = buildRetryStatusLine({
      message: "when does semester start?",
      topics: ["academic_calendar"],
      sessionCount: 1,
      hasMatchedActivity: false,
      retryReason: "dates",
    });
    expect(datesEn.length).toBeGreaterThan(0);
    expect(datesEn.length).toBeLessThan(80);
    expect(datesEn).toMatch(/verif|double-check/i);

    const incompleteMs = buildRetryStatusLine({
      message: "senarai cuti semester",
      topics: ["academic_calendar"],
      sessionCount: 1,
      hasMatchedActivity: false,
      retryReason: "incomplete",
    });
    expect(incompleteMs).toMatch(/jawapan|respons/i);
  });
});

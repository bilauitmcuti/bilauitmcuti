import { describe, expect, it } from "vitest";
import {
  isComplexReasoningTurn,
  REASONING_PARAGRAPH_DELAY_MS,
  shouldEmitReasoningParagraph,
  shouldShowThinkingIndicator,
  THINKING_INDICATOR_DELAY_MS,
} from "@/lib/chat/reasoning-gate";

describe("reasoning-gate", () => {
  it("treats agent, multi-topic, and non-simple turns as complex", () => {
    expect(
      isComplexReasoningTurn({
        isSimple: true,
        useAgentTools: true,
        wantsTableOutput: false,
        multipleSessionsSelected: false,
        asksDetail: false,
        needsList: false,
        topics: ["academic_calendar"],
      })
    ).toBe(true);

    expect(
      isComplexReasoningTurn({
        isSimple: true,
        useAgentTools: false,
        wantsTableOutput: false,
        multipleSessionsSelected: false,
        asksDetail: false,
        needsList: false,
        topics: ["academic_calendar", "uitm_general"],
      })
    ).toBe(true);

    expect(
      isComplexReasoningTurn({
        isSimple: false,
        useAgentTools: false,
        wantsTableOutput: false,
        multipleSessionsSelected: false,
        asksDetail: false,
        needsList: false,
        topics: ["academic_calendar"],
      })
    ).toBe(true);
  });

  it("delays thinking and reasoning by configured thresholds", () => {
    const start = 1_000;
    expect(shouldShowThinkingIndicator(start, start + THINKING_INDICATOR_DELAY_MS - 1)).toBe(
      false
    );
    expect(shouldShowThinkingIndicator(start, start + THINKING_INDICATOR_DELAY_MS)).toBe(true);
    expect(shouldEmitReasoningParagraph(start, start + REASONING_PARAGRAPH_DELAY_MS - 1)).toBe(
      false
    );
    expect(shouldEmitReasoningParagraph(start, start + REASONING_PARAGRAPH_DELAY_MS)).toBe(true);
  });
});

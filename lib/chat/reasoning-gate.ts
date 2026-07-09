import type { ChatTopic } from "@/lib/chat/topic-router";

/** Show the thinking shimmer only after this delay (ms). */
export const THINKING_INDICATOR_DELAY_MS = 2000;

/** Emit / show reasoning paragraphs only after this delay (ms). */
export const REASONING_PARAGRAPH_DELAY_MS = 4000;

export interface ReasoningComplexityInput {
  isSimple: boolean;
  useAgentTools: boolean;
  wantsTableOutput: boolean;
  multipleSessionsSelected: boolean;
  asksDetail: boolean;
  needsList: boolean;
  topics: ChatTopic[];
}

/** Heuristic for multi-step turns that benefit from a reasoning paragraph once slow enough. */
export function isComplexReasoningTurn(input: ReasoningComplexityInput): boolean {
  if (input.useAgentTools) return true;
  if (input.wantsTableOutput) return true;
  if (input.multipleSessionsSelected) return true;
  if (input.asksDetail) return true;
  if (input.needsList) return true;
  if (input.topics.length > 1) return true;
  if (!input.isSimple) return true;
  return false;
}

export function shouldEmitReasoningParagraph(
  turnStartMs: number,
  now: number = Date.now()
): boolean {
  return now - turnStartMs >= REASONING_PARAGRAPH_DELAY_MS;
}

export function shouldShowThinkingIndicator(
  turnStartMs: number,
  now: number = Date.now()
): boolean {
  return now - turnStartMs >= THINKING_INDICATOR_DELAY_MS;
}

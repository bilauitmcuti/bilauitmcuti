import type { ChatTopic } from "@/lib/chat/topic-router";

/** Show the thinking shimmer only after this brief delay (ms). */
export const THINKING_INDICATOR_DELAY_MS = 2000;

/** Emit / show reasoning paragraphs only after this delay (ms). */
export const REASONING_PARAGRAPH_DELAY_MS = 2500;

/** Show "Thought for X …" only when duration exceeds this many whole seconds. */
export const THINKING_LABEL_MIN_DURATION_SEC = 4;

export interface ReasoningComplexityInput {
  isSimple: boolean;
  useAgentTools: boolean;
  wantsTableOutput: boolean;
  multipleSessionsSelected: boolean;
  asksDetail: boolean;
  needsList: boolean;
  topics: ChatTopic[];
}

export type ReasoningPhaseKind = "start" | "progress" | "final" | "retry";

export function buildReasoningComplexityInput(
  input: Omit<ReasoningComplexityInput, "useAgentTools">
): ReasoningComplexityInput {
  return { ...input, useAgentTools: false };
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

export function shouldEmitReasoningPhase(
  turnStartMs: number,
  isComplexTurn: boolean,
  phase: ReasoningPhaseKind,
  now: number = Date.now()
): boolean {
  if (phase === "retry") return true;
  if (phase === "start") return isComplexTurn;
  if (isComplexTurn) return true;
  return now - turnStartMs >= REASONING_PARAGRAPH_DELAY_MS;
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

export function shouldShowThinkingDurationLabel(durationSec?: number): boolean {
  return (durationSec ?? 0) > THINKING_LABEL_MIN_DURATION_SEC;
}

/** Duration label on the thinking row (not the collapsible reasoning body). */
export function shouldShowCompletedDurationLabel(input: {
  thinkingDurationSec?: number;
  hasReasoningContent: boolean;
}): boolean {
  if (input.hasReasoningContent) return true;
  return shouldShowThinkingDurationLabel(input.thinkingDurationSec);
}

export function formatThinkingDurationLabel(durationSec: number): string {
  if (durationSec >= 60) {
    const mins = Math.round(durationSec / 60);
    return mins === 1 ? "1 min" : `${mins} mins`;
  }
  return `${durationSec} seconds`;
}

export function shouldShowCompletedThinkingBlock(input: {
  thinkingDurationSec?: number;
  hasReasoningContent: boolean;
}): boolean {
  if (input.hasReasoningContent) return true;
  return shouldShowThinkingDurationLabel(input.thinkingDurationSec);
}

export function captureThinkingMetadata(
  messageTimestamp: number | undefined,
  options?: { now?: number; hasReasoning?: boolean }
): { hadThinking: boolean; thinkingDurationSec?: number } {
  const now = options?.now ?? Date.now();
  const started = messageTimestamp ?? now;
  const elapsed = now - started;
  const durationSec = Math.max(1, Math.ceil(elapsed / 1000));

  if (options?.hasReasoning) {
    return { hadThinking: true, thinkingDurationSec: durationSec };
  }

  const hadVisibleThinking = elapsed >= THINKING_INDICATOR_DELAY_MS;
  if (!hadVisibleThinking) {
    return { hadThinking: false };
  }

  return {
    hadThinking: true,
    thinkingDurationSec: durationSec,
  };
}

export interface RenderReasoningUiInput {
  reasoningUiSupported?: boolean;
  isThinkingPhase: boolean;
  showThinking: boolean;
  hasReasoningContent: boolean;
  isRegenerating: boolean;
  hasProgressLabel: boolean;
  answerStreaming: boolean;
  answerComplete: boolean;
  thinkingDurationSec?: number;
}

export function shouldRenderReasoningUi(input: RenderReasoningUiInput): boolean {
  if (input.reasoningUiSupported === false) return false;

  const showThinkingUi =
    input.isThinkingPhase && (input.showThinking || input.hasReasoningContent);
  const showLiveRegenerating = input.isRegenerating && input.hasProgressLabel;
  const showDurationLabel = shouldShowCompletedDurationLabel({
    thinkingDurationSec: input.thinkingDurationSec,
    hasReasoningContent: input.hasReasoningContent,
  });
  const showDuringAnswerStream =
    input.answerStreaming && (input.hasReasoningContent || showDurationLabel);
  const showCompletedBlock =
    input.answerComplete &&
    shouldShowCompletedThinkingBlock({
      thinkingDurationSec: input.thinkingDurationSec,
      hasReasoningContent: input.hasReasoningContent,
    });

  return (
    showThinkingUi ||
    showLiveRegenerating ||
    showDuringAnswerStream ||
    showCompletedBlock
  );
}

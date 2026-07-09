import { useEffect, useState } from "react";
import {
  REASONING_PARAGRAPH_DELAY_MS,
  THINKING_INDICATOR_DELAY_MS,
} from "@/lib/chat/reasoning-gate";

export function useReasoningVisibility(active: boolean, startedAt?: number) {
  const [showThinking, setShowThinking] = useState(false);
  const [showReasoningSlot, setShowReasoningSlot] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowThinking(false);
      setShowReasoningSlot(false);
      return;
    }

    const start = startedAt ?? Date.now();
    const thinkingDelay = Math.max(0, THINKING_INDICATOR_DELAY_MS - (Date.now() - start));
    const reasoningDelay = Math.max(0, REASONING_PARAGRAPH_DELAY_MS - (Date.now() - start));

    const thinkingTimer = window.setTimeout(() => setShowThinking(true), thinkingDelay);
    const reasoningTimer = window.setTimeout(() => setShowReasoningSlot(true), reasoningDelay);

    return () => {
      window.clearTimeout(thinkingTimer);
      window.clearTimeout(reasoningTimer);
    };
  }, [active, startedAt]);

  return { showThinking, showReasoningSlot };
}

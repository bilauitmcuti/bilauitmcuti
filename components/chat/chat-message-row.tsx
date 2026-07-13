"use client";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Check, Copy, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useRef, type CSSProperties } from "react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  CHAT_ACTION_APPEAR,
  StreamdownRenderer,
} from "@/components/ui/streamdown-renderer";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScrollerItem,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";
import { formatTime24, type ChatMessageItem } from "@/components/chat/chat-utils";
import { useLiveDurationSec } from "@/components/chat/use-live-duration-sec";
import { useReasoningVisibility } from "@/components/chat/use-reasoning-visibility";
import { CHAT_STREAM_PHASE } from "@/lib/chat/stream-phase";
import { isMinimalConversationalMessage } from "@/lib/chat/intent";
import {
  shouldShowCompletedDurationLabel,
  shouldRenderReasoningUi,
} from "@/lib/chat/reasoning-gate";

interface ChatMessageRowProps {
  message: ChatMessageItem;
  scrollAnchor: boolean;
  isLastUserMessage: boolean;
  copiedId: string | null;
  reaction: "up" | "down" | null | undefined;
  onCopy: (msgId: string, content: string) => void;
  onReaction: (msgId: string, type: "up" | "down") => void;
  onEdit: (msgId: string) => void;
  onDelete: (msgId: string) => void;
}

export function ChatMessageRow({
  message,
  scrollAnchor,
  isLastUserMessage,
  copiedId,
  reaction,
  onCopy,
  onReaction,
  onEdit,
  onDelete,
}: ChatMessageRowProps) {
  const assistantInProgress =
    message.role === "assistant" && message.isComplete === false;
  const sawStreamingRef = useRef(message.isComplete === false);
  if (message.isComplete === false) sawStreamingRef.current = true;
  const answerStreaming = assistantInProgress && message.content.trim().length > 0;
  const isRegenerating =
    assistantInProgress &&
    !answerStreaming &&
    message.streamPhase === CHAT_STREAM_PHASE.RETRY;
  const progressLabel = message.statusMessage?.trim();
  const reasoningText = message.reasoning?.trim() ?? "";
  const hasReasoningContent = reasoningText.length > 0;
  const isThinkingPhase =
    assistantInProgress && !answerStreaming && !isRegenerating;

  const { showThinking, showReasoningSlot } = useReasoningVisibility(
    isThinkingPhase,
    message.timestamp
  );

  const showThinkingUi =
    isThinkingPhase && (showThinking || hasReasoningContent);
  const showLiveRegenerating = isRegenerating && Boolean(progressLabel);
  const answerComplete = message.isComplete !== false;
  const liveDurationSec = useLiveDurationSec(
    message.timestamp,
    assistantInProgress && message.thinkingDurationSec === undefined
  );
  const resolvedDurationSec = message.thinkingDurationSec ?? liveDurationSec;
  const isMinimalTurn = isMinimalConversationalMessage(message.userPrompt ?? "");
  const showDurationLabel = shouldShowCompletedDurationLabel({
    thinkingDurationSec: resolvedDurationSec,
    hasReasoningContent,
  });
  const showThoughtHeader = shouldRenderReasoningUi({
    reasoningUiSupported: message.reasoningUiSupported,
    isMinimalTurn,
    isThinkingPhase,
    showThinking,
    hasReasoningContent,
    isRegenerating,
    hasProgressLabel: Boolean(progressLabel),
    answerStreaming,
    answerComplete,
    thinkingDurationSec: resolvedDurationSec,
  });

  const enterAnimation =
    message.role === "user"
      ? "animate-in fade-in duration-150 ease-out fill-mode-both motion-reduce:animate-none"
      : undefined;

  const timestamp = formatTime24(
    message.timestamp ?? (parseInt(message.id, 10) || 0)
  );

  if (message.role === "user") {
    return (
      <MessageScrollerItem
        messageId={message.id}
        scrollAnchor={scrollAnchor}
        className={enterAnimation}
      >
        <Message align="end">
          <MessageContent>
            <ContextMenu>
              <ContextMenuTrigger
                render={
                  <Bubble align="end" className="cursor-context-menu select-none" />
                }
              >
                <BubbleContent className="rounded-br-md whitespace-pre-wrap">
                  {message.content}
                </BubbleContent>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-fit max-w-[200px]">
                {isLastUserMessage && (
                  <ContextMenuItem onClick={() => onEdit(message.id)}>
                    <Pencil data-icon="inline-start" />
                    Edit
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => onCopy(message.id, message.content)}>
                  <Copy data-icon="inline-start" />
                  Copy
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDelete(message.id)}>
                  <Trash2 data-icon="inline-start" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            <MessageFooter className="justify-end opacity-80">{timestamp}</MessageFooter>
          </MessageContent>
        </Message>
      </MessageScrollerItem>
    );
  }

  const assistantFinished =
    message.isComplete !== false && message.content.trim().length > 0;
  const animateActions = assistantFinished && sawStreamingRef.current;
  const actionBlurClass = animateActions ? "chat-action-blur-in" : undefined;
  const actionBlurStyle = (index: number): CSSProperties | undefined =>
    animateActions
      ? {
          animationDelay: `${index * CHAT_ACTION_APPEAR.staggerMs}ms`,
          ["--chat-action-blur-duration"]: `${CHAT_ACTION_APPEAR.durationMs}ms`,
        }
      : undefined;

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={scrollAnchor}>
      <Message align="start">
        <MessageContent>
          {showThoughtHeader ? (
            <Reasoning
              className="w-full"
              collapsible={hasReasoningContent}
              collapseWhen={message.isComplete === true && hasReasoningContent}
              expandReasoning={
                hasReasoningContent && showReasoningSlot && isThinkingPhase
              }
              defaultOpen={false}
              duration={resolvedDurationSec}
              isStreaming={showThinkingUi || showLiveRegenerating}
            >
              <ReasoningTrigger
                showChevron={hasReasoningContent}
                showDurationLabel={
                  showDurationLabel && !showThinkingUi && !showLiveRegenerating
                }
                getThinkingMessage={(isStreaming) => {
                  if (!showLiveRegenerating || !progressLabel) return null;
                  return isStreaming ? (
                    <span className="shimmer text-muted-foreground">{progressLabel}</span>
                  ) : (
                    <span>{progressLabel}</span>
                  );
                }}
              />
              {hasReasoningContent ? (
                <ReasoningContent>{reasoningText}</ReasoningContent>
              ) : null}
            </Reasoning>
          ) : null}
          {message.content.trim() ? (
            <Bubble variant="ghost">
              <BubbleContent className="px-1 py-1">
                <StreamdownRenderer
                  content={message.content}
                  isComplete={message.isComplete !== false}
                />
              </BubbleContent>
            </Bubble>
          ) : null}
          {assistantFinished && (
            <MessageFooter className="gap-0 px-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onCopy(message.id, message.content)}
                aria-label="Copy answer"
                className={actionBlurClass}
                style={actionBlurStyle(0)}
              >
                {copiedId === message.id ? (
                  <Check className="text-primary" />
                ) : (
                  <Copy />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onReaction(message.id, "up")}
                aria-label="Thumbs up"
                className={cn(
                  actionBlurClass,
                  "active:scale-[0.97] transition-transform duration-[160ms] ease-out motion-reduce:transition-none",
                  reaction === "up" ? "text-foreground" : "text-muted-foreground"
                )}
                style={actionBlurStyle(1)}
              >
                <ThumbsUp className={reaction === "up" ? "fill-current" : undefined} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onReaction(message.id, "down")}
                aria-label="Thumbs down"
                className={cn(
                  actionBlurClass,
                  "active:scale-[0.97] transition-transform duration-[160ms] ease-out motion-reduce:transition-none",
                  reaction === "down" ? "text-foreground" : "text-muted-foreground"
                )}
                style={actionBlurStyle(2)}
              >
                <ThumbsDown className={reaction === "down" ? "fill-current" : undefined} />
              </Button>
            </MessageFooter>
          )}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

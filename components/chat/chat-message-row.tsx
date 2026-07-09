"use client";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Check, Copy, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
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
import { useReasoningVisibility } from "@/components/chat/use-reasoning-visibility";

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
  const answerStreaming = assistantInProgress && message.content.trim().length > 0;
  const reasoningText = message.reasoning?.trim() ?? "";
  const { showThinking, showReasoningSlot } = useReasoningVisibility(
    assistantInProgress && !answerStreaming,
    message.timestamp
  );
  const showThinkingIndicator =
    assistantInProgress && !answerStreaming && showThinking;
  const showReasoningParagraph = showReasoningSlot && reasoningText.length > 0;
  const showReasoningChrome = showThinkingIndicator || showReasoningParagraph;

  const enterAnimation =
    message.role === "user"
      ? "animate-in fade-in blur-in duration-300 fill-mode-both"
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

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={scrollAnchor}>
      <Message align="start">
        <MessageContent>
          {showReasoningChrome ? (
            <Reasoning className="w-full" isStreaming={showThinkingIndicator}>
              <ReasoningTrigger />
              {showReasoningParagraph ? (
                <ReasoningContent>{reasoningText}</ReasoningContent>
              ) : null}
            </Reasoning>
          ) : null}
          {message.content.trim() ? (
            <Bubble variant="ghost">
              <BubbleContent className="px-1 py-1">
                <MarkdownRenderer
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
                  "active:scale-90 transition-transform duration-150",
                  reaction === "up" ? "text-foreground" : "text-muted-foreground"
                )}
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
                  "active:scale-90 transition-transform duration-150",
                  reaction === "down" ? "text-foreground" : "text-muted-foreground"
                )}
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

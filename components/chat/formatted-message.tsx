"use client";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import {
  contentToMarkdown,
  shouldUseMarkdownRenderer,
} from "@/lib/chat/markdown-suitability";

interface FormattedMessageProps {
  content: string;
  /** False while streaming; markdown is only rendered once the reply is complete. */
  isComplete?: boolean;
}

/**
 * Renders assistant message content. Plain prose answers are shown as-is; replies
 * containing markdown structure (headings, lists, tables) render via MarkdownRenderer.
 * While streaming, content stays plain to avoid flashing half-parsed markdown.
 */
export function FormattedMessage({ content, isComplete = true }: FormattedMessageProps) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (!isComplete || !shouldUseMarkdownRenderer(trimmed)) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{trimmed}</p>
    );
  }

  return <MarkdownRenderer content={contentToMarkdown(trimmed)} />;
}

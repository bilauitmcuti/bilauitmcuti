"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

const StreamdownRenderer = dynamic(
  () =>
    import("@/components/ui/streamdown-renderer").then((mod) => ({
      default: mod.StreamdownRenderer,
    })),
  { ssr: false }
);

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** False while streaming; uses Streamdown streaming mode. */
  isComplete?: boolean;
}

function PlainMarkdownFallback({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return (
    <p className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", className)}>
      {trimmed}
    </p>
  );
}

export function MarkdownRenderer({
  content,
  className,
  isComplete = true,
}: MarkdownRendererProps) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  return (
    <Suspense
      fallback={<PlainMarkdownFallback content={trimmed} className={className} />}
    >
      <StreamdownRenderer
        content={content}
        className={className}
        isComplete={isComplete}
      />
    </Suspense>
  );
}

"use client";

import { Component, useEffect, useState, type ReactNode } from "react";

import { shouldUseMarkdownRenderer } from "@/lib/chat/markdown-suitability";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** False while streaming; uses Streamdown streaming mode. */
  isComplete?: boolean;
}

function PlainMarkdownFallback({
  content,
  className,
  isComplete = true,
}: {
  content: string;
  className?: string;
  isComplete?: boolean;
}) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return (
    <p
      className={cn(
        "text-sm leading-relaxed whitespace-pre-wrap break-words",
        !isComplete && "animate-in fade-in blur-in duration-300 fill-mode-both",
        className
      )}
    >
      {trimmed}
    </p>
  );
}

class StreamdownErrorBoundary extends Component<
  { content: string; className?: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Streamdown render failed:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <PlainMarkdownFallback
          content={this.props.content}
          className={this.props.className}
        />
      );
    }
    return this.props.children;
  }
}

function RichMarkdown({
  content,
  className,
  isComplete,
  trimmed,
}: MarkdownRendererProps & { trimmed: string }) {
  const [StreamdownRenderer, setStreamdownRenderer] = useState<
  typeof import("@/components/ui/streamdown-renderer").StreamdownRenderer | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/components/ui/streamdown-renderer").then((mod) => {
      if (!cancelled) setStreamdownRenderer(() => mod.StreamdownRenderer);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!StreamdownRenderer) {
    return (
      <PlainMarkdownFallback
        content={trimmed}
        className={className}
        isComplete={isComplete}
      />
    );
  }

  return (
    <StreamdownErrorBoundary content={trimmed} className={className}>
      <StreamdownRenderer
        content={content}
        className={className}
        isComplete={isComplete}
      />
    </StreamdownErrorBoundary>
  );
}

export function MarkdownRenderer({
  content,
  className,
  isComplete = true,
}: MarkdownRendererProps) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (!shouldUseMarkdownRenderer(trimmed)) {
    return (
      <PlainMarkdownFallback
        content={trimmed}
        className={className}
        isComplete={isComplete}
      />
    );
  }

  return (
    <RichMarkdown
      content={content}
      className={className}
      isComplete={isComplete}
      trimmed={trimmed}
    />
  );
}

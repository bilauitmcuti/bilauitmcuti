"use client";

import type { Components } from "react-markdown";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { Component, type ReactNode, useSyncExternalStore } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { contentToMarkdown } from "@/lib/chat/markdown-suitability";
import { cn } from "@/lib/utils";

export interface StreamdownRendererProps {
  content: string;
  className?: string;
  isComplete?: boolean;
}

/** Word-by-word blur while the assistant reply streams in. */
export const CHAT_STREAM_ANIMATION = {
  animation: "blurIn",
  duration: 250,
  easing: "ease-out",
  sep: "word",
} as const;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

function PlainTextFallback({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return (
    <p
      className={cn(
        "text-sm leading-relaxed whitespace-pre-wrap break-words",
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
        <PlainTextFallback
          content={this.props.content}
          className={this.props.className}
        />
      );
    }
    return this.props.children;
  }
}

function isSafeExternalHref(href: string | undefined): boolean {
  if (!href?.trim()) return false;
  try {
    const protocol = new URL(href, "https://bilauitmcuti.com").protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

const COMPONENTS: Components = {
  h1: ({ children }) => (
    <p className="mt-2 font-semibold text-foreground first:mt-0">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mt-2 font-semibold text-foreground first:mt-0">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mt-2 font-semibold text-foreground first:mt-0">{children}</p>
  ),
  h4: ({ children }) => (
    <p className="mt-2 font-semibold text-foreground first:mt-0">{children}</p>
  ),
  h5: ({ children }) => (
    <p className="mt-2 font-semibold text-foreground first:mt-0">{children}</p>
  ),
  h6: ({ children }) => (
    <p className="mt-2 font-semibold text-foreground first:mt-0">{children}</p>
  ),
  p: ({ children }) => <p className="mt-1 first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 first:mt-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-1 flex list-decimal flex-col gap-0.5 pl-5 first:mt-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ children, href }) => {
    if (!isSafeExternalHref(href)) {
      return <span className="text-primary">{children}</span>;
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
  img: () => null,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-1 border-l-2 border-border pl-3 text-muted-foreground first:mt-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2 border-border" />,
  table: ({ children }) => (
    <div className="mt-2 overflow-hidden rounded-lg border border-border first:mt-0">
      <Table>{children}</Table>
    </div>
  ),
  thead: ({ children }) => <TableHeader>{children}</TableHeader>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => (
    <TableHead className="text-xs font-semibold">{children}</TableHead>
  ),
  td: ({ children }) => <TableCell className="text-xs">{children}</TableCell>,
};

export function StreamdownRenderer({
  content,
  className,
  isComplete = true,
}: StreamdownRendererProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const trimmed = content.trim();
  if (!trimmed) return null;

  const markdown = contentToMarkdown(trimmed);
  const isStreaming = !isComplete;
  const shouldAnimate = isStreaming && !prefersReducedMotion;

  return (
    <StreamdownErrorBoundary content={trimmed} className={className}>
      <div className={cn("text-sm leading-relaxed break-words", className)}>
        <Streamdown
          mode={isStreaming ? "streaming" : "static"}
          isAnimating={shouldAnimate}
          animated={shouldAnimate ? CHAT_STREAM_ANIMATION : false}
          components={COMPONENTS}
          disallowedElements={["img"]}
          unwrapDisallowed
        >
          {markdown}
        </Streamdown>
      </div>
    </StreamdownErrorBoundary>
  );
}

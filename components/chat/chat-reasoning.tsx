"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChatReasoningProps {
  reasoning: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function ChatReasoning({
  reasoning,
  isCollapsed,
  onToggleCollapsed,
}: ChatReasoningProps) {
  const trimmed = reasoning.trim();
  if (!trimmed) return null;

  return (
    <div className="mb-2 rounded-lg border border-border/60 bg-muted/30">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
        aria-expanded={!isCollapsed}
      >
        <span>Reasoning</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            isCollapsed && "-rotate-90"
          )}
        />
      </button>
      {!isCollapsed ? (
        <div
          className={cn(
            "max-h-40 overflow-y-auto border-t border-border/50 px-3 py-2",
            "text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap"
          )}
        >
          {trimmed}
        </div>
      ) : (
        <p className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground/80 line-clamp-2">
          {trimmed}
        </p>
      )}
    </div>
  );
}

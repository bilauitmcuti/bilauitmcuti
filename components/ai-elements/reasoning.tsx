"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { formatThinkingDurationLabel } from "@/lib/chat/reasoning-gate";

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  /** When false, render a static thinking row without collapse/chevron. */
  collapsible?: boolean;
  /** Open the reasoning body while thinking (before answer completes). */
  expandReasoning?: boolean;
  /** Collapse reasoning after the final answer is complete. */
  collapseWhen?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    collapsible = true,
    expandReasoning = false,
    collapseWhen = false,
    open,
    defaultOpen,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const resolvedDefaultOpen = defaultOpen ?? (collapsible ? isStreaming : true);
    const isExplicitlyClosed = defaultOpen === false;

    const [isOpen, setIsOpen] = useControllableState<boolean>({
      defaultProp: resolvedDefaultOpen,
      onChange: onOpenChange,
      prop: open,
    });
    const [duration, setDuration] = useControllableState<number | undefined>({
      defaultProp: undefined,
      prop: durationProp,
    });

    const userDismissedDuringStreamRef = useRef(false);
    const startTimeRef = useRef<number | null>(null);
    const hasCollapsedAfterAnswerRef = useRef(false);

    useEffect(() => {
      if (isStreaming) {
        userDismissedDuringStreamRef.current = false;
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, setDuration]);

    useEffect(() => {
      if (
        collapsible &&
        expandReasoning &&
        !isOpen &&
        !isExplicitlyClosed &&
        !userDismissedDuringStreamRef.current
      ) {
        setIsOpen(true);
      }
    }, [collapsible, expandReasoning, isOpen, setIsOpen, isExplicitlyClosed]);

    useEffect(() => {
      if (!collapsible || !collapseWhen || hasCollapsedAfterAnswerRef.current || !isOpen) {
        return;
      }

      const timer = setTimeout(() => {
        setIsOpen(false);
        hasCollapsedAfterAnswerRef.current = true;
      }, AUTO_CLOSE_DELAY);

      return () => clearTimeout(timer);
    }, [collapsible, collapseWhen, isOpen, setIsOpen]);

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        if (isStreaming && !newOpen) {
          userDismissedDuringStreamRef.current = true;
        }
        setIsOpen(newOpen);
      },
      [isStreaming, setIsOpen]
    );

    const contextValue = useMemo(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen]
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        {collapsible ? (
          <Collapsible
            {...props}
            className={cn("not-prose mb-4", className)}
            onOpenChange={(open) => handleOpenChange(open)}
            open={isOpen}
          >
            {children}
          </Collapsible>
        ) : (
          <div className={cn("not-prose mb-4", className)}>{children}</div>
        )}
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  getThinkingMessage?: (
    isStreaming: boolean,
    duration?: number,
    showDurationLabel?: boolean
  ) => ReactNode;
  showChevron?: boolean;
  /** When true after completion, show "Thought for X …" on the thinking row. */
  showDurationLabel?: boolean;
};

const defaultGetThinkingMessage = (
  isStreaming: boolean,
  duration?: number,
  showDurationLabel = false
) => {
  if (isStreaming || duration === 0) {
    return <span className="shimmer text-muted-foreground">Thinking…</span>;
  }
  if (showDurationLabel && duration !== undefined) {
    return <span>Thought for {formatThinkingDurationLabel(duration)}</span>;
  }
  return null;
};

const thinkingRowClassName =
  "flex w-full items-center gap-2 text-muted-foreground text-sm";

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    showChevron = true,
    showDurationLabel = false,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    const message =
      getThinkingMessage(isStreaming, duration, showDurationLabel) ??
      defaultGetThinkingMessage(isStreaming, duration, showDurationLabel);

    const resolvedMessage =
      message ??
      (showChevron ? (
        <span className="shimmer text-muted-foreground">Thinking…</span>
      ) : null);

    const label = (
      <span className="flex min-w-0 items-center gap-1.5 text-left">
        {resolvedMessage}
        {showChevron && resolvedMessage ? (
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        ) : null}
      </span>
    );

    if (!showChevron || !resolvedMessage) {
      return (
        <div className={cn(thinkingRowClassName, className)}>
          {children ?? resolvedMessage}
        </div>
      );
    }

    return (
      <CollapsibleTrigger
        className={cn(
          thinkingRowClassName,
          "transition-colors hover:text-foreground",
          className
        )}
        {...props}
      >
        {children ?? label}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => {
    const paragraph = children.trim();
    const [displayed, setDisplayed] = useState(paragraph);
    const [visible, setVisible] = useState(Boolean(paragraph));

    useEffect(() => {
      if (!paragraph) {
        setVisible(false);
        return;
      }
      if (paragraph === displayed) {
        setVisible(true);
        return;
      }
      setVisible(false);
      const timer = window.setTimeout(() => {
        setDisplayed(paragraph);
        setVisible(true);
      }, 140);
      return () => window.clearTimeout(timer);
    }, [paragraph, displayed]);

    return (
      <CollapsibleContent
        className={cn(
          "mt-4 text-sm",
          "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
          className
        )}
        {...props}
      >
        {displayed ? (
          <p
            className={cn(
              "leading-relaxed transition-opacity duration-200",
              visible ? "opacity-100" : "opacity-0"
            )}
          >
            {displayed}
          </p>
        ) : null}
      </CollapsibleContent>
    );
  }
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  markEngagementCompleted,
  markEngagementShown,
  recordEngagementAction as recordEngagementActionLib,
  resetEngagementCycle,
  type EngagementActionType,
} from "@/lib/engagement-prompt";
import { trackZarazEvent, ZARAZ_EVENTS } from "@/lib/zaraz";
import { EngagementPromptSheet } from "@/components/engagement-prompt-sheet";
import { useMobileViewport } from "@/lib/use-mobile-viewport";
import { CALENDAR_URL_CHANGE_EVENT } from "@/lib/overlay-cleanup";

interface EngagementPromptContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  recordEngagementAction: (type: EngagementActionType) => void;
  closeAfterShare: () => void;
  closeAfterFeedback: () => void;
  completeRating: () => void;
  dismissPrompt: () => void;
}

const EngagementPromptContext = createContext<EngagementPromptContextValue | null>(
  null
);

function isBlockingOverlayOpen(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.querySelectorAll('[data-slot="drawer-popup"][data-open]').length > 0 ||
    document.querySelectorAll('[data-slot="drawer-viewport"][data-modal="true"]').length > 0 ||
    document.querySelectorAll('[data-slot="drawer-overlay"]').length > 0
  );
}

export function EngagementPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ratedThisSessionRef = useRef(false);
  const pendingOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const clearPendingOpen = useCallback(() => {
    if (pendingOpenTimerRef.current) {
      clearTimeout(pendingOpenTimerRef.current);
      pendingOpenTimerRef.current = null;
    }
  }, []);

  const tryOpenPrompt = useCallback(() => {
    const attemptOpen = () => {
      if (isBlockingOverlayOpen()) {
        pendingOpenTimerRef.current = setTimeout(attemptOpen, 500);
        return;
      }
      pendingOpenTimerRef.current = null;
      markEngagementShown();
      trackZarazEvent(ZARAZ_EVENTS.engagementPromptShown);
      setOpen(true);
    };

    clearPendingOpen();
    pendingOpenTimerRef.current = setTimeout(attemptOpen, 300);
  }, [clearPendingOpen]);

  const recordEngagementAction = useCallback(
    (type: EngagementActionType) => {
      const result = recordEngagementActionLib(type);
      if (result.shouldOpen) {
        tryOpenPrompt();
      }
    },
    [tryOpenPrompt]
  );

  const closeWithoutPersisting = useCallback(() => {
    resetEngagementCycle();
    clearPendingOpen();
    setOpen(false);
  }, [clearPendingOpen]);

  const closeAfterShare = useCallback(() => {
    closeWithoutPersisting();
  }, [closeWithoutPersisting]);

  const closeAfterFeedback = useCallback(() => {
    closeWithoutPersisting();
  }, [closeWithoutPersisting]);

  const completeRating = useCallback(() => {
    ratedThisSessionRef.current = true;
    markEngagementCompleted();
    clearPendingOpen();
  }, [clearPendingOpen]);

  const dismissPrompt = useCallback(() => {
    if (!ratedThisSessionRef.current) {
      resetEngagementCycle();
    }
    ratedThisSessionRef.current = false;
    clearPendingOpen();
    setOpen(false);
  }, [clearPendingOpen]);

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;
    dismissPrompt();
  }, [pathname, dismissPrompt]);

  useEffect(() => {
    const handleCalendarUrlChange = () => {
      dismissPrompt();
    };

    window.addEventListener(
      CALENDAR_URL_CHANGE_EVENT,
      handleCalendarUrlChange as EventListener
    );
    return () => {
      window.removeEventListener(
        CALENDAR_URL_CHANGE_EVENT,
        handleCalendarUrlChange as EventListener
      );
    };
  }, [dismissPrompt]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setOpen(true);
        return;
      }
      dismissPrompt();
    },
    [dismissPrompt]
  );

  return (
    <EngagementPromptContext.Provider
      value={{
        open,
        setOpen: handleOpenChange,
        recordEngagementAction,
        closeAfterShare,
        closeAfterFeedback,
        completeRating,
        dismissPrompt,
      }}
    >
      {children}
    </EngagementPromptContext.Provider>
  );
}

export function useEngagementPrompt(): EngagementPromptContextValue {
  const ctx = useContext(EngagementPromptContext);
  if (!ctx) {
    throw new Error("useEngagementPrompt must be used within EngagementPromptProvider");
  }
  return ctx;
}

function EngagementPromptHost() {
  const { open, setOpen, closeAfterShare, closeAfterFeedback, completeRating } =
    useEngagementPrompt();
  const isMobileSheet = useMobileViewport();

  return (
    <EngagementPromptSheet
      open={open}
      onOpenChange={setOpen}
      isMobileSheet={isMobileSheet}
      onShareComplete={closeAfterShare}
      onFeedbackComplete={closeAfterFeedback}
      onRatingComplete={completeRating}
    />
  );
}

export function EngagementPromptRoot({ children }: { children: ReactNode }) {
  return (
    <EngagementPromptProvider>
      {children}
      <EngagementPromptHost />
    </EngagementPromptProvider>
  );
}

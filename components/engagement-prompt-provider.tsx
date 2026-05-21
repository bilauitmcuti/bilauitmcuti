"use client";

import { type ReactNode } from "react";
import {
  EngagementPromptProvider,
  useEngagementPrompt,
} from "@/components/engagement-prompt-context";
import { EngagementPromptSheet } from "@/components/engagement-prompt-sheet";
import { useMobileViewport } from "@/lib/use-mobile-viewport";

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

export { useEngagementPrompt } from "@/components/engagement-prompt-context";

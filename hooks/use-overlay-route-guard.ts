"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CALENDAR_URL_CHANGE_EVENT,
  dismissBlockingOverlays,
  releaseModalInteractionLocks,
} from "@/lib/overlay-cleanup";

/** Release stale modal interaction locks on App Router and replaceState calendar navigations. */
export function useOverlayRouteGuard(): void {
  const pathname = usePathname();

  useEffect(() => {
    releaseModalInteractionLocks();
  }, []);

  useEffect(() => {
    dismissBlockingOverlays();
  }, [pathname]);

  useEffect(() => {
    const handleCalendarUrlChange = () => {
      dismissBlockingOverlays();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        dismissBlockingOverlays();
      }
    };

    window.addEventListener(
      CALENDAR_URL_CHANGE_EVENT,
      handleCalendarUrlChange as EventListener
    );
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener(
        CALENDAR_URL_CHANGE_EVENT,
        handleCalendarUrlChange as EventListener
      );
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);
}

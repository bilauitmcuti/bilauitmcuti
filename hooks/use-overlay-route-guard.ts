"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CALENDAR_URL_CHANGE_EVENT,
  dismissBlockingOverlays,
} from "@/lib/overlay-cleanup";

/** Purge stale overlay portals on App Router and replaceState calendar navigations. */
export function useOverlayRouteGuard(): void {
  const pathname = usePathname();

  useEffect(() => {
    dismissBlockingOverlays();
  }, [pathname]);

  useEffect(() => {
    const handleCalendarUrlChange = () => {
      dismissBlockingOverlays();
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
  }, []);
}

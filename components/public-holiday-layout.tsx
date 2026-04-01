"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicHolidayHeader } from "@/components/public-holiday-header";
import { PublicHolidayControls } from "@/components/public-holiday-controls";
import { PublicHolidayGridView } from "@/components/public-holiday-grid-view";
import { PublicHolidayListView } from "@/components/public-holiday-list-view";
import type {
  PublicHolidayItem,
  PublicHolidayMeta,
  PublicHolidayRouteSelection,
} from "@/lib/public-holiday-types";
import type { PublicHolidayViewMode } from "@/lib/public-holiday-route-utils";
import { getPublicHolidayRoutePath } from "@/lib/public-holiday-route-utils";

interface PublicHolidayLayoutProps {
  viewMode: PublicHolidayViewMode;
  selected: PublicHolidayRouteSelection;
  meta: PublicHolidayMeta;
  holidays: PublicHolidayItem[];
  initialCurrentDate: string;
}

export function PublicHolidayLayout({
  viewMode,
  selected,
  meta,
  holidays,
  initialCurrentDate,
}: PublicHolidayLayoutProps) {
  const router = useRouter();
  const [showCountdown, setShowCountdown] = useState(true);
  const [weekendMode, setWeekendMode] = useState<"sun" | "mon">("sun");

  const stateLabelMap = new Map(meta.stateOptions.map((item) => [item.value, item.label]));

  useEffect(() => {
    try {
      const countdownRaw = localStorage.getItem("publicHolidayShowCountdown");
      const weekendRaw = localStorage.getItem("publicHolidayWeekendMode");
      if (countdownRaw != null) setShowCountdown(countdownRaw === "true");
      if (weekendRaw === "sun" || weekendRaw === "mon") setWeekendMode(weekendRaw);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("publicHolidayShowCountdown", String(showCountdown));
      localStorage.setItem("publicHolidayWeekendMode", weekendMode);
      document.cookie = `publicHolidayShowCountdown=${showCountdown}; path=/; max-age=31536000; samesite=lax`;
      document.cookie = `publicHolidayWeekendMode=${weekendMode}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore storage/cookie errors.
    }
  }, [showCountdown, weekendMode]);

  const handleViewModeChange = useCallback(
    (mode: PublicHolidayViewMode) => {
      const path = getPublicHolidayRoutePath(selected, mode);
      router.replace(path, { scroll: false });
      window.scrollTo(0, 0);
    },
    [router, selected]
  );

  const handleSelectionChange = useCallback(
    (next: PublicHolidayRouteSelection) => {
      const path = getPublicHolidayRoutePath(next, viewMode);
      router.replace(path, { scroll: false });
      window.scrollTo(0, 0);
    },
    [router, viewMode]
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-none">
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-4 transition-none">
        <PublicHolidayHeader />
        <PublicHolidayControls
          viewMode={viewMode}
          selected={selected}
          meta={meta}
          onViewModeChange={handleViewModeChange}
          onSelectionChange={handleSelectionChange}
          showCountdown={showCountdown}
          onShowCountdownChange={setShowCountdown}
          weekendMode={weekendMode}
          onWeekendModeChange={setWeekendMode}
        />
        <div className="min-h-[400px]">
          {viewMode === "grid" ? (
            <PublicHolidayGridView
              holidays={holidays}
              stateLabelMap={stateLabelMap}
              initialCurrentDate={initialCurrentDate}
              weekendMode={weekendMode}
              showCountdown={showCountdown}
            />
          ) : (
            <PublicHolidayListView
              holidays={holidays}
              stateLabelMap={stateLabelMap}
              initialCurrentDate={initialCurrentDate}
              showCountdown={showCountdown}
            />
          )}
        </div>
      </div>
    </div>
  );
}

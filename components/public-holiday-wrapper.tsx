import { notFound } from "next/navigation";
import { PublicHolidayLayout } from "@/components/public-holiday-layout";
import { fetchPublicHolidayData, fetchPublicHolidayMeta } from "@/lib/public-holiday-api";
import {
  getPublicHolidaySelectionFromRouteKey,
  type PublicHolidayViewMode,
  isValidPublicHolidayRouteKey,
} from "@/lib/public-holiday-route-utils";
import { mergePublicHolidaysByNameAndDate } from "@/lib/public-holiday-merge";

interface PublicHolidayWrapperProps {
  viewMode: PublicHolidayViewMode;
  routeKey: string;
}

function getMalaysiaCurrentDate(): string {
  try {
    const now = new Date();
    const malaysiaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
    );
    const year = malaysiaTime.getFullYear();
    const month = String(malaysiaTime.getMonth() + 1).padStart(2, "0");
    const day = String(malaysiaTime.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function PublicHolidayWrapper({
  viewMode,
  routeKey,
}: PublicHolidayWrapperProps) {
  const meta = await fetchPublicHolidayMeta();
  if (!isValidPublicHolidayRouteKey(routeKey, meta)) {
    notFound();
  }

  const selected = getPublicHolidaySelectionFromRouteKey(routeKey);
  const year = meta.defaultYear ?? 2026;
  const holidays =
    selected.scope === "all"
      ? mergePublicHolidaysByNameAndDate(
          (
            await Promise.all([
              fetchPublicHolidayData({ year, scope: "federal" }),
              fetchPublicHolidayData({ year, scope: "state" }),
            ])
          ).flatMap((result) => result.holidays)
        )
      : mergePublicHolidaysByNameAndDate(
          (
            await fetchPublicHolidayData({
              year,
              scope: selected.scope,
              state: selected.state ?? undefined,
            })
          ).holidays
        );

  return (
    <PublicHolidayLayout
      viewMode={viewMode}
      selected={selected}
      meta={meta}
      holidays={holidays}
      initialCurrentDate={getMalaysiaCurrentDate()}
    />
  );
}

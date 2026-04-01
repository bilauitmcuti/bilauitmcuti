import type {
  PublicHolidayRouteSelection,
  PublicHolidayMeta,
} from "@/lib/public-holiday-types";

export type PublicHolidayViewMode = "grid" | "list";

export function getPublicHolidaySelectionFromRouteKey(
  routeKey: string
): PublicHolidayRouteSelection {
  if (!routeKey) return { scope: "all", state: null };
  if (routeKey === "federal") return { scope: "federal", state: null };
  if (routeKey === "state") return { scope: "state", state: null };
  return { scope: "state", state: routeKey };
}

export function isValidPublicHolidayRouteKey(
  routeKey: string,
  meta: PublicHolidayMeta
): boolean {
  if (!routeKey) return true;
  if (routeKey === "federal" || routeKey === "state") return true;
  return meta.stateOptions.some((state) => state.value === routeKey);
}

export function getPublicHolidayRoutePath(
  selection: PublicHolidayRouteSelection,
  viewMode: PublicHolidayViewMode
): string {
  let base = "/public-holiday";
  if (selection.scope === "federal") base = "/public-holiday-federal";
  if (selection.scope === "state" && selection.state) {
    base = `/public-holiday-${selection.state}`;
  } else if (selection.scope === "state") {
    base = "/public-holiday-state";
  }
  return viewMode === "grid" ? base : `${base}/list`;
}

export function getSelectionLabel(
  selection: PublicHolidayRouteSelection,
  meta: PublicHolidayMeta
): string {
  if (selection.scope === "all") return "All";
  if (selection.scope === "federal") return "Federal";
  if (selection.scope === "state" && !selection.state) return "State";
  const match = meta.stateOptions.find((item) => item.value === selection.state);
  return match?.label ?? "State";
}

"use client";

import { useOverlayRouteGuard } from "@/hooks/use-overlay-route-guard";

/** Root-level guard — purges stale overlay portals on route / URL changes. */
export function OverlayRouteGuard() {
  useOverlayRouteGuard();
  return null;
}

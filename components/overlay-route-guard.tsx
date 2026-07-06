"use client";

import { useOverlayRouteGuard } from "@/hooks/use-overlay-route-guard";

/** Root-level guard — releases stale modal locks on route / URL changes. */
export function OverlayRouteGuard() {
  useOverlayRouteGuard();
  return null;
}

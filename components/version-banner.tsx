"use client";

import { useSyncExternalStore } from "react";
import {
  getVersionSnapshot,
  subscribe,
} from "@/lib/version-store";

export function VersionBanner() {
  const { isVisible, countdown } = useSyncExternalStore(
    subscribe,
    getVersionSnapshot,
    () => ({ isVisible: false, countdown: 5 })
  );

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-muted text-foreground text-center text-sm py-2">
      New version available. Refresh in {countdown}s...
    </div>
  );
}

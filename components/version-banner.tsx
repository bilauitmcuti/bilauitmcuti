"use client";

import { useSyncExternalStore } from "react";
import {
  getVersionSnapshot,
  subscribe,
  type VersionSnapshot,
} from "@/lib/version-store";

const SERVER_VERSION_SNAPSHOT: VersionSnapshot = {
  isVisible: false,
  countdown: 5,
};

export function VersionBanner() {
  const { isVisible, countdown } = useSyncExternalStore(
    subscribe,
    getVersionSnapshot,
    () => SERVER_VERSION_SNAPSHOT
  );

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-muted text-foreground text-center text-sm py-2">
      New version available. Refresh in {countdown}s...
    </div>
  );
}

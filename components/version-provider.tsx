"use client";

import { useEffect, type ReactNode } from "react";
import { VersionBanner } from "@/components/version-banner";
import { startVersionPolling } from "@/lib/version-store";

/** Global update detection for every App Router page under app/layout.tsx. */
export function VersionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    startVersionPolling();
  }, []);

  return (
    <>
      <VersionBanner />
      {children}
    </>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { VersionBanner } from "@/components/version-banner";
import { startVersionPolling, stopVersionPolling } from "@/lib/version-store";

/** Global update detection for App Router pages except `/chat`. */
export function VersionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/chat";

  useEffect(() => {
    if (isChatRoute) {
      stopVersionPolling();
      return;
    }
    startVersionPolling();
    return () => stopVersionPolling();
  }, [isChatRoute]);

  return (
    <>
      {!isChatRoute && <VersionBanner />}
      {children}
    </>
  );
}

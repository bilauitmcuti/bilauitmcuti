"use client";

import type { ReactNode } from "react";
import { VersionBanner } from "@/components/version-banner";

export function VersionProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <VersionBanner />
      {children}
    </>
  );
}

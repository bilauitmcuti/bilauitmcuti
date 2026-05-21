"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useTurnstileSiteKey,
  type TurnstileSiteKeyState,
} from "@/hooks/use-turnstile-site-key";

const TurnstileSiteKeyContext = createContext<TurnstileSiteKeyState | null>(null);

export function TurnstileSiteKeyProvider({
  initialSiteKey = "",
  children,
}: {
  initialSiteKey?: string;
  children: ReactNode;
}) {
  const value = useTurnstileSiteKey(initialSiteKey);
  return (
    <TurnstileSiteKeyContext.Provider value={value}>
      {children}
    </TurnstileSiteKeyContext.Provider>
  );
}

export function useTurnstileSiteKeyFromContext(): TurnstileSiteKeyState {
  const ctx = useContext(TurnstileSiteKeyContext);
  if (!ctx) {
    throw new Error("useTurnstileSiteKeyFromContext must be used within TurnstileSiteKeyProvider");
  }
  return ctx;
}

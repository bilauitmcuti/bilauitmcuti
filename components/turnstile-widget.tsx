"use client";

import Script from "next/script";
import { useEffect, useId, useMemo } from "react";

/**
 * Cloudflare Turnstile managed widget (implicit rendering).
 * Script is loaded normally and .cf-turnstile auto-renders the widget.
 */
declare global {
  interface Window {
    [key: string]: unknown;
  }
}

export interface TurnstileWidgetProps {
  siteKey: string;
  action?: string;
  onToken: (token: string) => void;
  className?: string;
  /** Visual theme for the managed widget. */
  theme?: "auto" | "light" | "dark";
  /** Width behavior for the managed widget. */
  size?: "normal" | "flexible" | "compact";
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function TurnstileWidget({
  siteKey,
  action,
  onToken,
  className,
  theme = "auto",
  size = "flexible",
}: TurnstileWidgetProps) {
  const safeSiteKey = useMemo(() => siteKey?.trim() ?? "", [siteKey]);
  const idBase = useId().replace(/[^a-zA-Z0-9_]/g, "");
  const successCallbackName = `turnstileSuccess_${idBase}`;
  const errorCallbackName = `turnstileError_${idBase}`;
  const expiredCallbackName = `turnstileExpired_${idBase}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as Record<string, unknown>)[successCallbackName] = (token: string) =>
      onToken(token);
    (window as Record<string, unknown>)[errorCallbackName] = () => onToken("");
    (window as Record<string, unknown>)[expiredCallbackName] = () => onToken("");
    return () => {
      delete (window as Record<string, unknown>)[successCallbackName];
      delete (window as Record<string, unknown>)[errorCallbackName];
      delete (window as Record<string, unknown>)[expiredCallbackName];
    };
  }, [successCallbackName, errorCallbackName, expiredCallbackName, onToken]);

  if (!safeSiteKey) return null;

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_SRC} strategy="afterInteractive" />
      <div
        className={`cf-turnstile w-full ${className ?? ""}`.trim()}
        data-sitekey={safeSiteKey}
        data-action={action ?? undefined}
        data-theme={theme}
        data-size={size}
        data-callback={successCallbackName}
        data-error-callback={errorCallbackName}
        data-expired-callback={expiredCallbackName}
      />
    </>
  );
}

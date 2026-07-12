"use client";

import { useSyncExternalStore } from "react";

export type PwaInstallPlatform = "android" | "ios" | "desktop";

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
}

/** Detect install platform from the current browser user agent. */
export function getPwaInstallPlatform(): PwaInstallPlatform {
  const ua = getUserAgent();
  if (/android/i.test(ua)) return "android";
  // iPadOS 13+ may report as Mac; treat touch Macs as iOS.
  const isIpadOs =
    /iPad|iPhone|iPod/i.test(ua) ||
    (typeof navigator !== "undefined" &&
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1);
  if (isIpadOs) return "ios";
  return "desktop";
}

/**
 * iPad / iPadOS (including iPadOS 13+ that report as MacIntel + touch).
 * iPhone/iPod return false.
 */
export function isIpad(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = getUserAgent();
  if (/iPad/i.test(ua)) return true;
  // iPadOS 13+ desktop UA
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

/**
 * True Safari on iOS (not Chrome/Firefox/Edge wrappers).
 * Add-to-Home-Screen only works reliably in Safari.
 */
export function isIosSafari(): boolean {
  if (getPwaInstallPlatform() !== "ios") return false;
  const ua = getUserAgent();
  if (/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua)) return false;
  return /Safari/i.test(ua);
}

export function getPwaSharedCaption(platform: PwaInstallPlatform): string {
  if (platform === "desktop") {
    return "Get quicker access to calendars, semester activities and holidays—right from your computer.";
  }
  return "Get quicker access to calendars, semester activities and holidays—right from your Home screen.";
}

function subscribeNoop(): () => void {
  return () => {};
}

/** Client platform after hydrate; `null` on the server to avoid mismatch. */
export function usePwaInstallPlatform(): PwaInstallPlatform | null {
  return useSyncExternalStore(
    subscribeNoop,
    getPwaInstallPlatform,
    () => null
  );
}

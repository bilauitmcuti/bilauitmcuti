"use client";

import { useEffect, useRef, useState } from "react";

const BUILD_ACK_KEY = "app-build-ack";

interface VersionResponse {
  buildId?: string;
}
/** Production only; longer interval to cut noise and server load. */
const POLL_INTERVAL_MS = 60_000;

function getLoadedBuildId(): string {
  if (typeof document === "undefined") return "";
  return (
    document.querySelector('meta[name="app-build-id"]')?.getAttribute("content")?.trim() ??
    process.env.NEXT_PUBLIC_BUILD_ID?.trim() ??
    ""
  );
}

export function VersionBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingBuildIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    function clearPoll() {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as VersionResponse;
        const loadedBuildId = getLoadedBuildId();
        if (!loadedBuildId || !buildId) return;
        if (sessionStorage.getItem(BUILD_ACK_KEY) === buildId) return;
        if (buildId !== loadedBuildId) {
          pendingBuildIdRef.current = buildId;
          setIsVisible(true);
          clearPoll();
        }
      } catch {
        // network error, skip
      }
    }

    function startPoll() {
      clearPoll();
      if (typeof document === "undefined" || document.visibilityState !== "visible")
        return;
      intervalRef.current = setInterval(checkVersion, POLL_INTERVAL_MS);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkVersion();
        startPoll();
      } else {
        clearPoll();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (document.visibilityState === "visible") {
      void checkVersion();
      startPoll();
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearPoll();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    if (countdown <= 0) {
      const buildId = pendingBuildIdRef.current;
      if (buildId) {
        try {
          sessionStorage.setItem(BUILD_ACK_KEY, buildId);
        } catch {
          // storage unavailable, still reload
        }
      }
      window.location.reload();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isVisible, countdown]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-muted text-foreground text-center text-sm py-2">
      New version available. Refresh in {countdown}s...
    </div>
  );
}

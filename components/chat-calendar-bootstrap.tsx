"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMetaCached, type MetaResponse } from "@/lib/calendar-api";
import { getSnapshot, setMeta } from "@/lib/calendar-store";

const FALLBACK_META: MetaResponse = {
  defaultSession: "B-20263",
  sessionOptions: [],
  programOptions: [],
};

/**
 * Keeps program/session dropdowns aligned with the homepage: same source as SSR and
 * CalendarDataGate — `/api/v1/meta?all=true` (see `fetchMetaCached({ entire: true })`).
 * Fetches meta when the store is still empty; skips a redundant GET when the catalogue
 * was already hydrated (e.g. from the calendar). Prefetch of `/` and `/list` still runs.
 */
export function ChatCalendarBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (getSnapshot().sessionOptions.length > 0) {
          /* Catalogue already hydrated (e.g. from homepage) — skip redundant meta GET. */
        } else {
          const meta = await fetchMetaCached({ entire: true });
          if (cancelled) return;
          if (meta.sessionOptions.length > 0) {
            setMeta(meta);
          } else if (getSnapshot().sessionOptions.length === 0) {
            setMeta(FALLBACK_META);
          }
        }
      } catch {
        if (cancelled) return;
        if (getSnapshot().sessionOptions.length === 0) {
          setMeta(FALLBACK_META);
        }
      }

      if (!cancelled) {
        router.prefetch("/");
        router.prefetch("/list");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

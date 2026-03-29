"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MetaResponse } from "@/lib/calendar-api";
import calendarData from "@/lib/calendar.json";
import { getSnapshot, setMeta } from "@/lib/calendar-store";

function metaFromCalendarJson(): MetaResponse {
  const o = calendarData as Record<string, unknown>;
  return {
    defaultSession:
      typeof o.defaultSession === "string" ? o.defaultSession : "A-20251",
    sessionOptions: Array.isArray(o.sessionOptions)
      ? (o.sessionOptions as MetaResponse["sessionOptions"])
      : [],
    programOptions: Array.isArray(o.programOptions)
      ? (o.programOptions as MetaResponse["programOptions"])
      : [],
  };
}

/** Hydrates session/program catalogue from `lib/calendar.json` (no calendar API on /chat). */
export function ChatCalendarBootstrap() {
  const router = useRouter();

  useEffect(() => {
    if (getSnapshot().sessionOptions.length === 0) setMeta(metaFromCalendarJson());
    router.prefetch("/");
    router.prefetch("/list");
  }, [router]);

  return null;
}

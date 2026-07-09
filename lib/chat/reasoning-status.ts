import type { MatchedActivity } from "@/lib/chat/activity-match";
import type { ChatToolName } from "@/lib/chat/agent/types";
import { detectUserLanguage, type UserLanguageMode } from "@/lib/chat-language";
import type { ChatTopic } from "@/lib/chat/topic-router";

export const MAX_REASONING_LINES = 4;
const MIN_STATUS_WORDS = 2;
const MAX_STATUS_WORDS = 6;

const FORBIDDEN_STATUS_TERMS =
  /\b(function calling|tool calls?|rag\b|embeddings?|vector search|loading data|internal apis?|composing answer|chain of thought|reasoning process|prefetch)\b/i;

type LangBucket = "en" | "malay";

function langBucket(mode: UserLanguageMode): LangBucket {
  return mode === "malay" ? "malay" : "en";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isValidStatusPhrase(text: string): boolean {
  const words = wordCount(text);
  return (
    words >= MIN_STATUS_WORDS &&
    words <= MAX_STATUS_WORDS &&
    !FORBIDDEN_STATUS_TERMS.test(text)
  );
}

/** Deterministic variation — same question gets the same phrase, different questions differ. */
export function pickProgressPhrase(pool: readonly string[], seed: string): string {
  const valid = pool.filter(isValidStatusPhrase);
  const choices = valid.length > 0 ? valid : pool;
  if (choices.length === 0) return "";
  if (choices.length === 1) return choices[0]!;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return choices[hash % choices.length]!;
}

const OPENER_POOLS: Record<string, Record<LangBucket, readonly string[]>> = {
  matched_activity: {
    en: ["Found it on calendar", "Checking that event", "Confirming event dates"],
    malay: ["Jumpa dalam kalendar", "Semak acara tersebut", "Sahkan tarikh acara"],
  },
  lecture_weeks: {
    en: ["Checking lecture weeks", "Finding week dates", "Looking up your week"],
    malay: ["Semak minggu kuliah", "Cari tarikh minggu", "Lihat minggu berapa"],
  },
  public_holiday: {
    en: ["Checking public holidays", "Finding holiday dates", "Looking up holidays"],
    malay: ["Semak cuti umum", "Cari tarikh cuti", "Lihat hari cuti"],
  },
  uitm_only: {
    en: ["Looking up UiTM info", "Checking campus details", "Finding UiTM details"],
    malay: ["Cari info UiTM", "Semak maklumat kampus", "Lihat butiran UiTM"],
  },
  uitm_calendar: {
    en: ["Checking calendar and UiTM", "Cross-checking your dates", "Reviewing calendar details"],
    malay: ["Semak kalendar dan UiTM", "Banding tarikh penting", "Lihat kalendar akademik"],
  },
  multi_session: {
    en: ["Comparing your sessions", "Checking each session", "Reviewing session dates"],
    malay: ["Banding sesi dipilih", "Semak setiap sesi", "Lihat tarikh sesi"],
  },
  academic_calendar: {
    en: ["Checking academic calendar", "Finding key dates", "Looking up calendar"],
    malay: ["Semak kalendar akademik", "Cari tarikh penting", "Lihat kalendar ini"],
  },
};

const TOOL_POOLS: Record<ChatToolName, Record<LangBucket, readonly string[]>> = {
  search_calendar_activities: {
    en: ["Searching the calendar", "Finding matching events", "Checking calendar events"],
    malay: ["Cari dalam kalendar", "Semak acara berkaitan", "Lihat acara sepadan"],
  },
  get_academic_calendar: {
    en: ["Reading academic calendar", "Checking term dates", "Reviewing the calendar"],
    malay: ["Baca kalendar akademik", "Semak tarikh semester", "Lihat kalendar penuh"],
  },
  get_upcoming_events: {
    en: ["Checking upcoming dates", "Finding what's next", "Looking ahead on calendar"],
    malay: ["Semak tarikh akan datang", "Lihat acara seterusnya", "Cari tarikh depan"],
  },
  get_session_timeline: {
    en: ["Reviewing session timeline", "Checking session flow", "Mapping session dates"],
    malay: ["Semak garis masa sesi", "Lihat aliran sesi", "Susun tarikh sesi"],
  },
  get_lecture_weeks: {
    en: ["Checking lecture weeks", "Finding week dates", "Looking up weeks"],
    malay: ["Semak minggu kuliah", "Cari tarikh minggu", "Lihat jadual minggu"],
  },
  get_public_holidays: {
    en: ["Checking public holidays", "Listing holiday dates", "Finding public holidays"],
    malay: ["Semak cuti umum", "Lihat senarai cuti", "Cari tarikh cuti"],
  },
  search_uitm_knowledge: {
    en: ["Looking up UiTM info", "Checking campus details", "Finding policy details"],
    malay: ["Cari info UiTM", "Semak butiran kampus", "Lihat polisi berkaitan"],
  },
};

const RETRY_POOLS: Record<"dates" | "incomplete", Record<LangBucket, readonly string[]>> = {
  dates: {
    en: ["Rechecking those dates", "Verifying date details"],
    malay: ["Semak tarikh sekali lagi", "Sahkan tarikh betul"],
  },
  incomplete: {
    en: ["Adding a bit more", "Filling in details"],
    malay: ["Tambah sedikit lagi", "Lengkapkan butiran penting"],
  },
};

function openerPoolKey(input: ReasoningOpenerInput): string {
  if (input.hasMatchedActivity && input.activityMatches[0]?.activity.name?.trim()) {
    return "matched_activity";
  }
  if (input.topics.includes("lecture_weeks")) return "lecture_weeks";
  if (input.topics.includes("public_holiday")) return "public_holiday";
  if (input.topics.includes("uitm_general") && !input.topics.includes("academic_calendar")) {
    return "uitm_only";
  }
  if (input.topics.includes("uitm_general")) return "uitm_calendar";
  if (input.sessionCount > 1) return "multi_session";
  return "academic_calendar";
}

export interface ReasoningOpenerInput {
  message: string;
  topics: ChatTopic[];
  hasMatchedActivity: boolean;
  activityMatches: MatchedActivity[];
  programLabel: string;
  sessionCount: number;
}

/** Short opener — user-meaningful progress, not internal detail. */
export function buildReasoningOpener(input: ReasoningOpenerInput): string {
  const lang = langBucket(detectUserLanguage(input.message));
  const key = openerPoolKey(input);
  const pool = OPENER_POOLS[key]?.[lang] ?? OPENER_POOLS.academic_calendar[lang];
  return pickProgressPhrase(pool, `${input.message}:${key}:open`);
}

/** Short per-step progress while calendar or UiTM facts are gathered. */
export function buildToolReasoningLine(
  toolName: ChatToolName,
  ctx: { message: string }
): string {
  const lang = langBucket(detectUserLanguage(ctx.message));
  const pool = TOOL_POOLS[toolName]?.[lang] ?? TOOL_POOLS.search_calendar_activities[lang];
  return pickProgressPhrase(pool, `${ctx.message}:${toolName}`);
}

export function buildRetryReasoningLine(
  reason: "dates" | "incomplete",
  message: string
): string {
  const lang = langBucket(detectUserLanguage(message));
  const pool = RETRY_POOLS[reason][lang];
  return pickProgressPhrase(pool, `${message}:retry:${reason}`);
}

/** Join progress lines; caps visible updates per response. */
export function appendReasoningLine(
  current: string,
  line: string,
  maxLines: number = MAX_REASONING_LINES
): string {
  const next = line.trim();
  if (!next) return current;

  const existing = current
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);

  if (existing.length >= maxLines) return current;
  if (existing.some((row) => row === next)) return current;
  if (current.endsWith(next)) return current;

  if (!current.trim()) return next;
  return `${current.trimEnd()}\n${next}`;
}

// Kept for compatibility with older tests/callers that trim snippets elsewhere.
export function truncateForReasoning(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  const max = 72;
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

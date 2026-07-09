import type { MatchedActivity } from "@/lib/chat/activity-match";
import type { ChatToolName } from "@/lib/chat/agent/types";
import { detectUserLanguage, type UserLanguageMode } from "@/lib/chat-language";
import type { ChatTopic } from "@/lib/chat/topic-router";

const MAX_SNIPPET_CHARS = 72;

export function truncateForReasoning(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  if (oneLine.length <= MAX_SNIPPET_CHARS) return oneLine;
  return `${oneLine.slice(0, MAX_SNIPPET_CHARS - 1)}…`;
}

function resolveLanguage(message: string): UserLanguageMode {
  return detectUserLanguage(message);
}

function quoteSnippet(message: string): string {
  const snippet = truncateForReasoning(message);
  return snippet ? `“${snippet}”` : "";
}

export interface ReasoningOpenerInput {
  message: string;
  topics: ChatTopic[];
  hasMatchedActivity: boolean;
  activityMatches: MatchedActivity[];
  programLabel: string;
  sessionCount: number;
}

/** First reasoning line — conversational, matched to the user's question. */
export function buildReasoningOpener(input: ReasoningOpenerInput): string {
  const lang = resolveLanguage(input.message);
  const quoted = quoteSnippet(input.message);
  const matchTitle = input.activityMatches[0]?.activity.name?.trim();
  const program = input.programLabel;

  if (input.hasMatchedActivity && matchTitle) {
    if (lang === "malay") {
      return `Saya nampak “${matchTitle}” dalam kalendar — saya semak tarikh rasminya untuk soalan anda.`;
    }
    if (lang === "mixed") {
      return `I found “${matchTitle}” on the calendar — checking the official dates for your question.`;
    }
    return `I found “${matchTitle}” on the calendar — let me confirm the official dates for you.`;
  }

  if (input.topics.includes("lecture_weeks")) {
    if (lang === "malay") {
      return `Okay, saya cari tarikh minggu kuliah (${program}) berdasarkan soalan ${quoted || "anda"}.`;
    }
    return `Let me work out the lecture week dates for ${program}${quoted ? ` — you asked ${quoted}` : ""}.`;
  }

  if (input.topics.includes("public_holiday")) {
    if (lang === "malay") {
      return `Saya semak cuti umum Malaysia yang berkaitan dengan soalan ${quoted || "anda"}.`;
    }
    return `I'll check which public holidays apply${quoted ? ` to ${quoted}` : ""}.`;
  }

  if (input.topics.includes("uitm_general") && !input.topics.includes("academic_calendar")) {
    if (lang === "malay") {
      return `Saya cari maklumat UiTM yang berkaitan dengan soalan ${quoted || "anda"}.`;
    }
    return `I'll look up UiTM info that fits${quoted ? ` ${quoted}` : " your question"}.`;
  }

  if (input.topics.includes("uitm_general")) {
    if (lang === "malay") {
      return `Saya semak kalendar akademik dan maklumat UiTM untuk jawab ${quoted || "soalan anda"}.`;
    }
    return `I'll cross-check the academic calendar and UiTM info${quoted ? ` for ${quoted}` : ""}.`;
  }

  if (input.sessionCount > 1) {
    if (lang === "malay") {
      return `Anda pilih ${input.sessionCount} sesi — saya bandingkan kalendar untuk ${quoted || "soalan ini"}.`;
    }
    return `You selected ${input.sessionCount} sessions — I'll compare them${quoted ? ` for ${quoted}` : ""}.`;
  }

  if (lang === "malay") {
    return `Saya semak kalendar akademik (${program}) untuk ${quoted || "soalan anda"}.`;
  }
  return `Let me search the ${program} academic calendar${quoted ? ` for ${quoted}` : ""}.`;
}

/** Per-tool line while data is being fetched. */
export function buildToolReasoningLine(
  toolName: ChatToolName,
  ctx: {
    message: string;
    programLabel: string;
    activityMatches: MatchedActivity[];
  }
): string {
  const lang = resolveLanguage(ctx.message);
  const quoted = quoteSnippet(ctx.message);
  const matchTitle = ctx.activityMatches[0]?.activity.name?.trim();
  const program = ctx.programLabel;

  switch (toolName) {
    case "search_calendar_activities":
      if (matchTitle) {
        return lang === "malay"
          ? `Saya sahkan “${matchTitle}” dengan rekod kalendar rasmi.`
          : `Confirming “${matchTitle}” against the official calendar.`;
      }
      return lang === "malay"
        ? `Saya imbas aktiviti kalendar yang sepadan dengan ${quoted || "soalan anda"}.`
        : `Scanning calendar events that match${quoted ? ` ${quoted}` : " your question"}.`;
    case "get_academic_calendar":
      return lang === "malay"
        ? `Saya muat kalendar akademik penuh untuk ${program}.`
        : `Pulling up the full ${program} academic calendar.`;
    case "get_upcoming_events":
      return lang === "malay"
        ? `Saya cari cuti dan peperiksaan akan datang yang relevan.`
        : `Looking for upcoming breaks and exams that matter here.`;
    case "get_session_timeline":
      return lang === "malay"
        ? `Saya susun garis masa sesi untuk ${program}.`
        : `Mapping the session timeline for ${program}.`;
    case "get_lecture_weeks":
      return lang === "malay"
        ? `Saya ambil tarikh minggu kuliah supaya jawapan tepat.`
        : `Getting lecture week dates so I can answer accurately.`;
    case "get_public_holidays":
      return lang === "malay"
        ? `Saya baca senarai cuti umum yang berkaitan.`
        : `Reading the public holiday list that applies.`;
    case "search_uitm_knowledge":
      return lang === "malay"
        ? `Saya cari maklumat kampus, yuran, dan polisi UiTM yang berkaitan.`
        : `Looking up campuses, fees, and UiTM policies that fit.`;
    default:
      return lang === "malay"
        ? `Saya ambil data yang diperlukan untuk ${quoted || "soalan ini"}.`
        : `Fetching the data I need${quoted ? ` for ${quoted}` : ""}.`;
  }
}

export function buildAnswerPhaseLine(message: string): string {
  const lang = resolveLanguage(message);
  if (lang === "malay") return "Saya sedang susun jawapan untuk anda.";
  return "Putting your answer together now.";
}

export function buildRetryReasoningLine(reason: "dates" | "incomplete", message: string): string {
  const lang = resolveLanguage(message);
  if (reason === "dates") {
    return lang === "malay"
      ? "Saya semak semula tarikh dalam jawapan ini."
      : "Double-checking the dates in my answer.";
  }
  return lang === "malay"
    ? "Jawapan nampak belum lengkap — saya tambah butiran yang perlu."
    : "The answer looked a bit short — adding what's missing.";
}

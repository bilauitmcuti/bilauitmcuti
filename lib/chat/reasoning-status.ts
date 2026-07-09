import type { MatchedActivity } from "@/lib/chat/activity-match";
import type { ChatToolName } from "@/lib/chat/agent/types";
import type { ChatTopic } from "@/lib/chat/topic-router";

const MAX_SNIPPET_CHARS = 72;

export function truncateForReasoning(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  if (oneLine.length <= MAX_SNIPPET_CHARS) return oneLine;
  return `${oneLine.slice(0, MAX_SNIPPET_CHARS - 1)}…`;
}

export interface ReasoningOpenerInput {
  message: string;
  topics: ChatTopic[];
  hasMatchedActivity: boolean;
  activityMatches: MatchedActivity[];
  programLabel: string;
  sessionCount: number;
}

/** First reasoning line — tied to the user's question and detected intent. */
export function buildReasoningOpener(input: ReasoningOpenerInput): string {
  const snippet = truncateForReasoning(input.message);
  const matchTitle = input.activityMatches[0]?.activity.name?.trim();

  if (input.hasMatchedActivity && matchTitle) {
    return `Recognized calendar event “${matchTitle}” — checking official dates for: “${snippet}”`;
  }

  if (input.topics.includes("lecture_weeks")) {
    return `Resolving lecture week dates (${input.programLabel}) for: “${snippet}”`;
  }

  if (input.topics.includes("public_holiday")) {
    return `Checking Malaysia public holidays relevant to: “${snippet}”`;
  }

  if (input.topics.includes("uitm_general") && !input.topics.includes("academic_calendar")) {
    return `Searching UiTM information for: “${snippet}”`;
  }

  if (input.topics.includes("uitm_general")) {
    return `Cross-referencing academic calendar and UiTM info for: “${snippet}”`;
  }

  if (input.sessionCount > 1) {
    return `Comparing ${input.sessionCount} selected sessions for: “${snippet}”`;
  }

  return `Searching the academic calendar (${input.programLabel}) for: “${snippet}”`;
}

/** Per-tool line while data is being fetched — includes user context. */
export function buildToolReasoningLine(
  toolName: ChatToolName,
  ctx: {
    message: string;
    programLabel: string;
    activityMatches: MatchedActivity[];
  }
): string {
  const snippet = truncateForReasoning(ctx.message);
  const matchTitle = ctx.activityMatches[0]?.activity.name?.trim();

  switch (toolName) {
    case "search_calendar_activities":
      return matchTitle
        ? `Confirming “${matchTitle}” against official calendar rows`
        : `Scanning calendar activities matching: “${snippet}”`;
    case "get_academic_calendar":
      return `Loading full academic calendar (${ctx.programLabel})`;
    case "get_upcoming_events":
      return `Finding the next upcoming breaks and exams for: “${snippet}”`;
    case "get_session_timeline":
      return `Building session timeline for ${ctx.programLabel}`;
    case "get_lecture_weeks":
      return `Pulling lecture week 1–N dates for: “${snippet}”`;
    case "get_public_holidays":
      return `Reading public holiday list for: “${snippet}”`;
    case "search_uitm_knowledge":
      return `Looking up UiTM campuses, fees, and policies for: “${snippet}”`;
    default:
      return `Fetching ${toolName} data for: “${snippet}”`;
  }
}

export function buildAnswerPhaseLine(message: string): string {
  return `Composing answer for: “${truncateForReasoning(message)}”`;
}

export function buildRetryReasoningLine(reason: "dates" | "incomplete", message: string): string {
  const snippet = truncateForReasoning(message);
  if (reason === "dates") {
    return `Verifying calendar dates in the answer for: “${snippet}”`;
  }
  return `Expanding incomplete answer for: “${snippet}”`;
}

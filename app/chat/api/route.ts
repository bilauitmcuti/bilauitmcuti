import { NextRequest, NextResponse } from "next/server";
import { askGroq, askGroqResearch, type ChatMessage } from "@/lib/ai";
import systemRules from "@/lib/system-rules.json";
import {
  activitiesGroupA,
  activitiesGroupB,
  programOptions,
  type Activity,
} from "@/lib/data";

// --- Rate Limiter (in-memory, IP-based sliding window) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max 10 requests per window

const rateLimitMap = new Map<string, number[]>();

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}, 5 * 60 * 1000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  valid.push(now);
  rateLimitMap.set(ip, valid);
  return false;
}

// --- Input Validation ---
const VALID_PROGRAMS = new Set(programOptions.map((p) => p.value));

function sanitizeMessage(message: string): string {
  return message
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, "")
    .replace(/ignore\s+(all\s+)?above\s+instructions/gi, "")
    .replace(/disregard\s+(all\s+)?previous/gi, "")
    .replace(/you\s+are\s+now\s+/gi, "")
    .replace(/new\s+instructions?\s*:/gi, "")
    .replace(/system\s*:/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .trim();
}

const CALENDAR_KEYWORDS = [
  "cuti",
  "semester",
  "peperiksaan",
  "exam",
  "tarikh",
  "date",
  "break",
  "kuliah",
  "lecture",
  "pendaftaran",
  "registration",
  "minggu ulangkaji",
  "revision",
  "yuran",
  "fee",
  "gugur taraf",
  "group a",
  "group b",
  "kumpulan",
  "jadual",
  "schedule",
  "bila",
  "when",
  "hari raya",
  "aidil",
  "mds",
];

function isCalendarQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return CALENDAR_KEYWORDS.some((kw) => lower.includes(kw));
}

function getFilteredGroupBActivities(program: string): Activity[] {
  return activitiesGroupB.filter((activity) => {
    if (program === "All" || program === "Foundation/Professional") return true;
    if (activity.semua) return true;
    if (activity.programType === program) return true;
    return false;
  });
}

function toDateFormat(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr;
}

function formatActivitiesAsContext(activities: Activity[]): string {
  return activities
    .map((a) => {
      let line = `- ${a.name}: ${toDateFormat(a.startDate)}`;
      if (a.endDate) line += ` to ${toDateFormat(a.endDate)}`;
      if (a.duration) line += ` (${a.duration})`;
      if (a.details) line += ` — ${a.details}`;
      if (a.type) line += ` [${a.type}]`;
      if (a.regionalStartDate) {
        line += `\n  Kedah/Kelantan/Terengganu: ${toDateFormat(a.regionalStartDate)}`;
        if (a.regionalEndDate) line += ` to ${toDateFormat(a.regionalEndDate)}`;
      }
      return line;
    })
    .join("\n");
}

/** Aggressive limits to avoid Groq 413. Use compact template (~900 chars) + data. */
const MAX_PRIMARY_CONTEXT_CHARS = 6_000;
const MAX_SECONDARY_CONTEXT_CHARS = 1_000;

function buildCalendarSystemPrompt(
  programLabel: string,
  primaryGroup: string,
  secondaryGroup: string,
  primaryContext: string,
  secondaryContext: string,
  primaryDesc: string,
  secondaryDesc: string
): string {
  const truncatedPrimary =
    primaryContext.length > MAX_PRIMARY_CONTEXT_CHARS
      ? primaryContext.slice(0, MAX_PRIMARY_CONTEXT_CHARS) + "\n...[truncated]"
      : primaryContext;
  const truncatedSecondary =
    secondaryContext.length > MAX_SECONDARY_CONTEXT_CHARS
      ? secondaryContext.slice(0, MAX_SECONDARY_CONTEXT_CHARS) + "\n...[truncated]"
      : secondaryContext;

  const rules = systemRules as { calendarPromptCompact: string; calendarPromptTemplate: string };
  const template = rules.calendarPromptCompact;
  return template
    .replace(/\{\{programLabel\}\}/g, programLabel)
    .replace(/\{\{primaryGroup\}\}/g, primaryGroup)
    .replace(/\{\{secondaryGroup\}\}/g, secondaryGroup)
    .replace(/\{\{primaryContext\}\}/g, truncatedPrimary)
    .replace(/\{\{secondaryContext\}\}/g, truncatedSecondary)
    .replace(/\{\{primaryDesc\}\}/g, primaryDesc)
    .replace(/\{\{secondaryDesc\}\}/g, secondaryDesc);
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const { message, program, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const selectedProgram =
      program && VALID_PROGRAMS.has(program) ? program : "All";
    const sanitizedMessage = sanitizeMessage(message);

    const programMeta = programOptions.find((p) => p.value === selectedProgram);
    const programLabel = programMeta?.label || selectedProgram;
    const primaryGroup = programMeta?.group || "B";
    const secondaryGroup = primaryGroup === "A" ? "B" : "A";

    const groupAContext = formatActivitiesAsContext(activitiesGroupA);
    const groupBActivities = getFilteredGroupBActivities(selectedProgram);
    const groupBContext = formatActivitiesAsContext(groupBActivities);

    const primaryContext = primaryGroup === "A" ? groupAContext : groupBContext;
    const secondaryContext = primaryGroup === "A" ? groupBContext : groupAContext;
    const primaryDesc =
      primaryGroup === "A"
        ? "Foundation/Professional - Semester December 2025 to May 2026"
        : "Pre-Diploma, Diploma, Bachelor's Degree, Master's & PhD - Semester March to August 2026";
    const secondaryDesc =
      primaryGroup === "A"
        ? "Pre-Diploma, Diploma, Bachelor's Degree, Master's & PhD - Semester March to August 2026"
        : "Foundation/Professional - Semester December 2025 to May 2026";

    const sanitizedHistory: ChatMessage[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-2)) {
        if (
          msg &&
          typeof msg.content === "string" &&
          (msg.role === "user" || msg.role === "assistant") &&
          msg.content.length <= 2000
        ) {
          sanitizedHistory.push({
            role: msg.role,
            content: msg.role === "user" ? sanitizeMessage(msg.content) : msg.content,
          });
        }
      }
    }

    const useCalendarPrompt = isCalendarQuestion(sanitizedMessage);
    const systemPrompt = useCalendarPrompt
      ? buildCalendarSystemPrompt(
          programLabel,
          primaryGroup,
          secondaryGroup,
          primaryContext,
          secondaryContext,
          primaryDesc,
          secondaryDesc
        )
      : (systemRules as { researchPrompt: string }).researchPrompt;

    const rawReply = useCalendarPrompt
      ? await askGroq(sanitizedMessage, systemPrompt, sanitizedHistory)
      : await askGroqResearch(sanitizedMessage, systemPrompt, sanitizedHistory);

    const reply = rawReply
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^[\s]*\*\s/gm, "- ")
      .replace(/#{1,6}\s?/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/~~/g, "");

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status;
    console.error("Chat API error:", errMsg, "status:", status);

    if (status === 401 || errMsg.includes("401") || errMsg.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "AI service authentication failed. Please check API key configuration." },
        { status: 502 }
      );
    }
    if (status === 403 || errMsg.includes("403") || errMsg.includes("Forbidden")) {
      return NextResponse.json(
        { error: "AI model access denied. Ensure openai/gpt-oss-120b and llama-3.1-8b-instant are enabled for your org." },
        { status: 502 }
      );
    }
    if (status === 413 || errMsg.includes("413")) {
      return NextResponse.json(
        { error: "Request too large. Try a shorter message or clear chat history." },
        { status: 413 }
      );
    }
    if (errMsg.includes("429") || errMsg.includes("rate")) {
      return NextResponse.json(
        { error: "AI service is busy. Please try again in a moment." },
        { status: 503 }
      );
    }
    if (errMsg.includes("503") || errMsg.includes("loading") || errMsg.includes("unavailable")) {
      return NextResponse.json(
        { error: "AI model is loading. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get response from AI. Please try again." },
      { status: 500 }
    );
  }
}

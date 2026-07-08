import { CHAT_MAX_HISTORY_CONTENT_LENGTH, CHAT_MAX_MESSAGE_LENGTH } from "@/lib/chat/limits";
export { CHAT_TURNSTILE_COOKIE } from "@/lib/chat/parse-request";
export { consumeChatStream, createMarkdownStreamPainter } from "@/lib/chat/sse";
export type { ChatStreamDonePayload } from "@/lib/chat/sse";

export function getChatErrorMessage(res: Response, fallback: string): string {
  if (res.status === 429) return "Too many requests. Please wait a moment before trying again.";
  if (res.status === 403) return "Access was blocked. Please refresh and try again.";
  if (res.status === 504) return "Request timed out. Please try again.";
  if (res.status >= 500) return "Server is temporarily unavailable. Please try again in a moment.";
  return fallback;
}

export async function parseChatResponse(res: Response): Promise<{
  error?: string;
  reply?: string;
  correlationId?: string;
  path?: string;
}> {
  const text = await res.text();
  try {
    return JSON.parse(text) as {
      error?: string;
      reply?: string;
      correlationId?: string;
      path?: string;
    };
  } catch {
    return { error: getChatErrorMessage(res, "Something went wrong. Please try again.") };
  }
}

/** Timeout until HTTP headers are received (time-to-first-byte). */
export const FETCH_HEADERS_TIMEOUT_MS = 60_000;
/** Timeout covering the full SSE stream read after headers arrive. */
export const FETCH_STREAM_TIMEOUT_MS = 120_000;
/** Backwards-compatible alias for callers that only need a single timeout. */
export const FETCH_TIMEOUT_MS = FETCH_HEADERS_TIMEOUT_MS;
export const RETRY_DELAYS_MS = [400, 800, 1600];
export const MAX_CHAT_MESSAGE_LENGTH = CHAT_MAX_MESSAGE_LENGTH;
export const MAX_HISTORY_CONTENT_LENGTH = CHAT_MAX_HISTORY_CONTENT_LENGTH;
export const MAX_HISTORY_ITEMS = 4;

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  correlationId?: string;
  userPrompt?: string;
  /** False while streaming; omit or true when the answer is finished. */
  isComplete?: boolean;
}

export interface MentionMatch {
  start: number;
  end: number;
  query: string;
}

export function prepareHistory(messages: ChatMessageItem[]): { role: "user" | "assistant"; content: string }[] {
  return messages
    .filter((msg) => msg.isComplete !== false)
    .slice(-MAX_HISTORY_ITEMS)
    .map((msg) => ({
      role: msg.role,
      content: msg.content.slice(0, MAX_HISTORY_CONTENT_LENGTH),
    }));
}

export function formatTime24(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function getActiveMentionMatch(value: string, caretIndex: number): MentionMatch | null {
  if (caretIndex < 0) return null;
  const prefix = value.slice(0, caretIndex);
  const atIndex = prefix.lastIndexOf("@");
  if (atIndex < 0) return null;
  const charBefore = atIndex > 0 ? prefix[atIndex - 1] : "";
  const isBoundary = atIndex === 0 || /\s/.test(charBefore);
  if (!isBoundary) return null;
  const query = prefix.slice(atIndex + 1);
  if (/\s/.test(query)) return null;
  return { start: atIndex, end: caretIndex, query };
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

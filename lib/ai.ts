/** Dev / preview / localhost chat model (fast, lower cost). */
export const MODEL_WORKERS_AI_DEV = "@cf/meta/llama-3.2-3b-instruct" as const;

/** Production chat model (stronger instruction following for rules and scope). */
export const MODEL_WORKERS_AI_PRODUCTION =
  "@cf/google/gemma-4-26b-a4b-it" as const;

/** @deprecated Use MODEL_WORKERS_AI_DEV */
export const MODEL_WORKERS_AI = MODEL_WORKERS_AI_DEV;

const PRODUCTION_SITE_HOST = "bilauitmcuti.com";

export type WorkersAiModelTier = "dev" | "production";

interface WorkersAiTierLimits {
  maxOutputTokens: number;
  maxSystemChars: number;
  maxHistoryMessages: number;
  maxMessageChars: number;
  maxUserPromptChars: number;
}

const TIER_LIMITS: Record<WorkersAiModelTier, WorkersAiTierLimits> = {
  dev: {
    maxOutputTokens: 2048,
    maxSystemChars: 12_000,
    maxHistoryMessages: 8,
    maxMessageChars: 2_400,
    maxUserPromptChars: 2_000,
  },
  production: {
    maxOutputTokens: 4096,
    maxSystemChars: 24_000,
    maxHistoryMessages: 10,
    maxMessageChars: 3_200,
    maxUserPromptChars: 2_400,
  },
};

/** Default max completion tokens (dev tier). */
export const MAX_OUTPUT_TOKENS = TIER_LIMITS.dev.maxOutputTokens;

/** @deprecated Use MAX_OUTPUT_TOKENS */
export const MAX_TOKENS_LLAMA = MAX_OUTPUT_TOKENS;

const DEFAULT_TEMPERATURE = 0.2;

function normalizeHost(host: string): string {
  return host.replace(/^www\./, "").split(":")[0].toLowerCase();
}

function isProductionSiteHost(host: string | null | undefined): boolean {
  if (!host?.trim()) return false;
  return normalizeHost(host) === PRODUCTION_SITE_HOST;
}

function isLocalOrPreviewHost(host: string): boolean {
  const h = normalizeHost(host);
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".pages.dev") ||
    h === "127.0.0.1"
  );
}

function isCloudflarePagesPreviewDeploy(): boolean {
  const url = process.env.CF_PAGES_URL?.toLowerCase() ?? "";
  return url.includes(".pages.dev");
}

/**
 * Production uses Gemma; dev (`pnpm dev`), `pnpm preview`, and Pages preview use Llama.
 * Optional overrides: WORKERS_AI_MODEL (any env), WORKERS_AI_USE_DEV_MODEL=1 (force Llama).
 */
export function resolveWorkersAiModelTier(requestHost?: string | null): WorkersAiModelTier {
  const override = process.env.WORKERS_AI_MODEL?.trim();
  if (override) {
    return override === MODEL_WORKERS_AI_PRODUCTION ? "production" : "dev";
  }

  if (process.env.WORKERS_AI_USE_DEV_MODEL === "1" || process.env.WORKERS_AI_USE_DEV_MODEL === "true") {
    return "dev";
  }

  if (process.env.NODE_ENV !== "production") return "dev";

  if (requestHost) {
    if (isProductionSiteHost(requestHost)) return "production";
    if (isLocalOrPreviewHost(requestHost)) return "dev";
  }

  if (isCloudflarePagesPreviewDeploy()) return "dev";

  if (process.env.CF_PAGES === "1") {
    const pagesUrl = process.env.CF_PAGES_URL?.toLowerCase() ?? "";
    if (pagesUrl && !pagesUrl.includes(".pages.dev")) return "production";
  }

  return "dev";
}

export function resolveWorkersAiModelId(requestHost?: string | null): string {
  const tier = resolveWorkersAiModelTier(requestHost);
  return tier === "production" ? MODEL_WORKERS_AI_PRODUCTION : MODEL_WORKERS_AI_DEV;
}

export function getWorkersAiTierLimits(tier: WorkersAiModelTier): WorkersAiTierLimits {
  return TIER_LIMITS[tier];
}

export function getMaxOutputTokensForHost(requestHost?: string | null): number {
  const tier = resolveWorkersAiModelTier(requestHost);
  return TIER_LIMITS[tier].maxOutputTokens;
}

interface WorkersAiTextResponse {
  response?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function isAiRateLimitError(error: unknown): boolean {
  const status =
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;
  if (status === 429) return true;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

export async function getAiBinding(): Promise<Ai | null> {
  try {
    const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getOptionalRequestContext();
    return (ctx?.env as CloudflareEnv | undefined)?.AI ?? null;
  } catch {
    return null;
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...[truncated]";
}

function buildMessages(
  prompt: string,
  systemPrompt: string | undefined,
  history: ChatMessage[] | undefined,
  limits: WorkersAiTierLimits
): { role: "system" | "user" | "assistant"; content: string }[] {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: truncate(systemPrompt, limits.maxSystemChars),
    });
  }

  if (history && history.length > 0) {
    const recentHistory = history.slice(-limits.maxHistoryMessages);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: truncate(msg.content, limits.maxMessageChars),
      });
    }
  }

  messages.push({
    role: "user",
    content: truncate(prompt, limits.maxUserPromptChars),
  });
  return messages;
}

function extractWorkersAiContent(result: unknown): string {
  if (typeof result === "string" && result.trim()) return result;

  if (result && typeof result === "object") {
    const data = result as WorkersAiTextResponse;
    if (typeof data.response === "string" && data.response.trim()) return data.response;
    const choiceContent = data.choices?.[0]?.message?.content;
    if (typeof choiceContent === "string" && choiceContent.trim()) return choiceContent;
  }

  throw new Error("Empty response from model");
}

async function workersAiChatCompletion(params: {
  modelId: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  max_tokens: number;
  temperature: number;
}): Promise<string> {
  const ai = await getAiBinding();
  if (!ai) {
    const err = new Error(
      "Workers AI binding not available. Add an AI binding named AI in Cloudflare Pages, or run pnpm preview locally."
    );
    Object.assign(err, { status: 503 });
    throw err;
  }

  try {
    const result = await ai.run(params.modelId, {
      messages: params.messages,
      max_tokens: params.max_tokens,
      temperature: params.temperature,
    });
    return extractWorkersAiContent(result);
  } catch (e) {
    if (e instanceof Error) {
      const msg = e.message.toLowerCase();
      if (msg.includes("429") || msg.includes("rate limit")) {
        Object.assign(e, { status: 429 });
      }
    }
    throw e;
  }
}

export async function askWorkersAi(
  prompt: string,
  systemPrompt: string | undefined,
  history: ChatMessage[] | undefined,
  options?: {
    maxTokens?: number;
    temperature?: number;
    /** Request Host header — selects production vs dev model on Cloudflare Pages. */
    requestHost?: string | null;
  }
): Promise<string> {
  const tier = resolveWorkersAiModelTier(options?.requestHost);
  const limits = getWorkersAiTierLimits(tier);
  const modelId = resolveWorkersAiModelId(options?.requestHost);
  const messages = buildMessages(prompt, systemPrompt, history, limits);
  return workersAiChatCompletion({
    modelId,
    messages,
    max_tokens: options?.maxTokens ?? limits.maxOutputTokens,
    temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
  });
}

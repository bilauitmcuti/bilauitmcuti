import { NextRequest, NextResponse } from "next/server";
import {
  getAiBinding,
  getMaxOutputTokensForHost,
  resolveProductionChatModelChain,
  resolveWorkersAiModelTier,
  shouldStreamTokensToClient,
  type ChatMessage,
} from "@/lib/ai";
import { getLanguageTurnDirective } from "@/lib/chat-language";
import { normalizeAssistantTables } from "@/lib/format-ai-table";
import {
  ensureSessionsInStore,
  loadActivitiesIntoStoreForChat,
  loadMetaIntoStore,
  validSetsFromMeta,
} from "@/lib/chat-calendar-load";
import {
  getActivitiesForSession,
  getDefaultSessionForGroup,
  getGroupFromSession,
  getProgramOptions,
  type SessionId,
} from "@/lib/data";
import {
  addDatesFromContextText,
  collectAllowedDateTokens,
} from "@/lib/chat/allowed-dates";
import { mergeSessionsForLoad, resolveQueryScope } from "@/lib/chat/query-scope";
import { UITM_GENERAL_INFO } from "@/lib/uitm-info";
import {
  getClientIpForTurnstile,
  getTurnstileExpectedHostname,
  verifyTurnstileToken,
} from "@/lib/turnstile";
import { isTurnstileVerificationRequired } from "@/lib/turnstile-config";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getModelResponseBudget,
  streamAiWithRetry,
  askAiWithRetry,
  askAgentWithRetry,
} from "@/lib/chat/ai-retry";
import {
  agentModeForModelChain,
  buildAgentTurnContext,
  buildCompactFallbackSystemPrompt,
  isChatAgentEnabled,
} from "@/lib/chat/agent";
import {
  buildComparisonContext,
  buildResearchSystemPrompt,
  buildSessionListContext,
  formatActivitiesAsContext,
  formatPrimaryCalendarContext,
  getActivitiesFromSessions,
  getFilteredActivitiesForSession,
  getFilteredGroupBActivities,
  MAX_PRIMARY_CONTEXT_CHARS,
  narrowActivitiesForSecondaryReference,
  resolveEffectiveSessions,
} from "@/lib/chat/context";
import { resolveCalendarContextIntent } from "@/lib/chat/calendar-intent";
import {
  buildDataContextForTurn,
  shouldUseCalendarIntentFilter,
  topicNeedsCalendarPrompt,
} from "@/lib/chat/build-data-context";
import {
  flattenActivitiesWithSession,
  matchActivitiesInMessage,
} from "@/lib/chat/activity-match";
import {
  buildChatAssistantSystemPrompt,
  usesResearchStylePrompt,
} from "@/lib/chat/chat-prompt";
import { routeChatTopics } from "@/lib/chat/topic-router";
import { buildPublicHolidayChatContext } from "@/lib/chat/public-holiday-context";
import {
  getCalendarUnderstandingDirective,
  getCompletionInstruction,
  isComparisonQuestion,
  isSimpleCalendarQuestion,
  isTableFormatRequested,
  messageAsksDetail,
  messageNeedsListOrSchedule,
  needsSecondaryGroupContext,
  needsUitmKnowledgeSupplement,
} from "@/lib/chat/intent";
import {
  DATE_VALIDATION_RETRY_NUDGE,
  replyHasUnknownCalendarDates,
} from "@/lib/chat/reply-validation";
import {
  detectIncompleteReply,
  REPLY_COMPLETION_RETRY_NUDGE,
} from "@/lib/chat/reply-completion";
import {
  CHAT_TURNSTILE_COOKIE,
  CHAT_TURNSTILE_COOKIE_MAX_AGE_SECONDS,
  MAX_BODY_SIZE_BYTES,
  parseChatRequest,
} from "@/lib/chat/parse-request";
import { generateCorrelationId, getCachedReply, setCachedReply } from "@/lib/chat/response-cache";
import { cleanAiReply, sanitizeMessage } from "@/lib/chat/sanitize";
import { getSystemRules } from "@/lib/chat/system-rules";
import { getTodayISO, toPromptDate } from "@/lib/chat/dates";
import { encodeSseEvent, SSE_HEADERS } from "@/lib/chat/sse";
import { mapChatError } from "@/lib/chat/map-error";
import { trimHistoryForModel } from "@/lib/chat/history-for-model";

/** Soft deadline for compact / single-stream turns (under Pages Edge limits). */
const CHAT_SERVER_DEADLINE_MS = 25_000;
/** Longer budget for Gemma tool-agent turns (tool steps + synthesis). */
const CHAT_AGENT_DEADLINE_MS = 55_000;

const AGENT_CALENDAR_TOOLS = new Set([
  "search_calendar_activities",
  "get_academic_calendar",
  "get_upcoming_events",
  "get_session_timeline",
  "get_lecture_weeks",
  "get_public_holidays",
]);

function agentUsedCalendarTools(toolsUsed: string[]): boolean {
  return toolsUsed.some((tool) => AGENT_CALENDAR_TOOLS.has(tool));
}

export type ChatExecutionMode = "single_stream" | "agent";

export interface ChatExecutionModeInput {
  isAgentToolsPath: boolean;
  /** Matched activity or simple date Q — one LLM call, no tool loop. */
  preferSingleStream?: boolean;
}

/**
 * Production Gemma (`isAgentToolsPath`) uses the tool agent for uitm_general /
 * knowledge turns. Calendar-only turns (any length) short-circuit to
 * single_stream with prebuilt DATA CONTEXT. Llama compact / legacy stays on
 * single_stream.
 */
export function resolveChatExecutionMode(
  input: ChatExecutionModeInput
): ChatExecutionMode {
  if (!input.isAgentToolsPath) return "single_stream";
  if (input.preferSingleStream) return "single_stream";
  return "agent";
}

/**
 * Prefer one LLM call when the handler can already supply authoritative
 * calendar context. Message length does not matter — long calendar questions
 * still short-circuit. Multi-topic calendar stays single_stream; only
 * uitm_general (knowledge / research tools) keeps the agent loop.
 */
export function shouldPreferSingleStream(input: {
  hasMatchedActivity: boolean;
  isSimple: boolean;
  topics: string[];
}): boolean {
  if (input.hasMatchedActivity || input.isSimple) return true;
  const { topics } = input;
  if (topics.length === 0) return false;
  if (topics.includes("uitm_general")) return false;
  return topics.every(
    (t) =>
      t === "academic_calendar" ||
      t === "lecture_weeks" ||
      t === "public_holiday"
  );
}

async function runWithServerDeadline<T>(
  deadlineMs: number,
  task: () => Promise<T>
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutError = new Error("Request took too long. Please try again.");
  Object.assign(timeoutError, { status: 504 });
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(timeoutError), deadlineMs);
  });
  try {
    return await Promise.race([task(), deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function jsonChatReply(
  reply: string,
  correlationId: string,
  path: "cache" | "llm"
): NextResponse {
  return NextResponse.json({ reply, correlationId, path });
}

export async function POST(request: NextRequest) {
  let correlationId = "unknown";
  let shouldSetVerifiedCookie = false;
  const withVerifiedCookie = (response: NextResponse): NextResponse => {
    if (!shouldSetVerifiedCookie) return response;
    response.cookies.set({
      name: CHAT_TURNSTILE_COOKIE,
      value: "1",
      maxAge: CHAT_TURNSTILE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });
    return response;
  };
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return jsonError("Content-Type must be application/json", 415);
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE_BYTES) {
      return jsonError("Request body too large", 413);
    }

    correlationId = generateCorrelationId();

    const rawBody = await request.json();

    const bodyStr = JSON.stringify(rawBody);
    if (bodyStr.length > MAX_BODY_SIZE_BYTES) {
      return jsonError("Request body too large", 413);
    }

    const parseResult = parseChatRequest(rawBody);
    if (!parseResult.success) {
      return jsonError(parseResult.error, 400);
    }

    const {
      message,
      program,
      selectedSessions: rawSelectedSessions,
      history,
      turnstileToken,
      stream: wantStream,
    } = parseResult.data;
    const isTurnstileRequired = isTurnstileVerificationRequired();
    const hasVerifiedCookie =
      request.cookies.get(CHAT_TURNSTILE_COOKIE)?.value === "1";

    if (isTurnstileRequired && !hasVerifiedCookie) {
      if (!turnstileToken?.trim()) {
        return jsonError("Please complete verification first.", 403);
      }
      const hostname = request.headers.get("host") ?? "";
      const turnstileResult = await verifyTurnstileToken({
        token: turnstileToken,
        expectedAction: "chat_message",
        expectedHostname: getTurnstileExpectedHostname(hostname),
        remoteip: getClientIpForTurnstile(request),
      });
      if (!turnstileResult.success) {
        return jsonError("Access was blocked. Please refresh and try again.", 403);
      }
      shouldSetVerifiedCookie = true;
    }

    const meta = await loadMetaIntoStore();
    const { validSessionIds, validPrograms } = validSetsFromMeta(meta);

    const selectedProgram =
      program && validPrograms.has(program) ? program : "All";
    const sanitizedMessage = sanitizeMessage(message);

    const programMeta = getProgramOptions().find((p) => p.value === selectedProgram);
    const programLabel = programMeta?.label || selectedProgram;
    const primaryGroup = (programMeta?.group || "B") as "A" | "B";
    const secondaryGroup = primaryGroup === "A" ? "B" : "A";

    const effectiveSessions = resolveEffectiveSessions(
      rawSelectedSessions,
      primaryGroup,
      validSessionIds
    );

    const todayISO = getTodayISO();
    const todayFormatted = toPromptDate(todayISO);

    const queryScope = resolveQueryScope(
      sanitizedMessage,
      primaryGroup,
      validSessionIds,
      todayISO
    );
    const loadSessions = mergeSessionsForLoad(
      effectiveSessions,
      queryScope,
      primaryGroup,
      getGroupFromSession
    );

    await loadActivitiesIntoStoreForChat(
      selectedProgram,
      primaryGroup,
      loadSessions
    );

    let contextSessionIds: SessionId[] = loadSessions;
    let primaryActivities = getActivitiesFromSessions(
      loadSessions,
      selectedProgram,
      primaryGroup
    );
    if (primaryActivities.length === 0) {
      const fallbackId =
        primaryGroup === "A"
          ? getDefaultSessionForGroup("A")
          : getDefaultSessionForGroup("B");
      contextSessionIds = [fallbackId];
      await ensureSessionsInStore(contextSessionIds, selectedProgram);
      primaryActivities =
        primaryGroup === "A"
          ? getActivitiesForSession(fallbackId)
          : getFilteredGroupBActivities(selectedProgram, [fallbackId]);
    }

    const contextIntent = resolveCalendarContextIntent(sanitizedMessage);

    const flatPool = flattenActivitiesWithSession(contextSessionIds, (sid) =>
      getFilteredActivitiesForSession(sid, selectedProgram, primaryGroup)
    );
    const activityMatches = matchActivitiesInMessage(sanitizedMessage, flatPool);
    const hasMatchedActivity = activityMatches.length > 0;

    const topicRoute = routeChatTopics(sanitizedMessage, hasMatchedActivity);
    const useIntentFilter = shouldUseCalendarIntentFilter(topicRoute, activityMatches.length);

    const sanitizedHistory: ChatMessage[] = trimHistoryForModel(
      (history ?? []).map((msg) => ({
        role: msg.role,
        content:
          msg.role === "user" ? sanitizeMessage(msg.content) : msg.content,
      }))
    );

    const requestHost = request.headers.get("host");
    const useAgentPath = isChatAgentEnabled();
    const modelChain = resolveProductionChatModelChain(requestHost);
    const agentMode = useAgentPath ? agentModeForModelChain(modelChain) : "compact";
    const isAgentToolsPath = useAgentPath && agentMode === "tools";

    const multipleSessionsSelected = effectiveSessions.length > 1;
    const wantsTableOutput =
      (multipleSessionsSelected && isComparisonQuestion(sanitizedMessage)) ||
      isTableFormatRequested(sanitizedMessage);
    const isSimple = isSimpleCalendarQuestion(sanitizedMessage, { hasMatchedActivity });
    const asksDetail = messageAsksDetail(sanitizedMessage);
    const needsList = messageNeedsListOrSchedule(sanitizedMessage);
    const executionMode = resolveChatExecutionMode({
      isAgentToolsPath,
      preferSingleStream: shouldPreferSingleStream({
        hasMatchedActivity,
        isSimple,
        topics: topicRoute.topics,
      }),
    });
    const useAgentTools = executionMode === "agent";

    const cacheKey = [
      useAgentPath ? `agent:${agentMode}` : "legacy",
      todayISO,
      selectedProgram,
      effectiveSessions.join(","),
      topicRoute.topics.join("+"),
      hasMatchedActivity ? "matched" : "nomatch",
      wantsTableOutput ? "table" : "normal",
      sanitizedMessage,
      JSON.stringify(sanitizedHistory),
    ].join("||");

    const cachedReply = getCachedReply(cacheKey);
    if (cachedReply) {
      return withVerifiedCookie(jsonChatReply(cachedReply, correlationId, "cache"));
    }

    const aiBindingPromise = getAiBinding();
    const origin = new URL(request.url).origin;

    const aiBinding = await aiBindingPromise;
    if (!aiBinding) {
      const noAi = mapChatError(
        Object.assign(new Error("Workers AI binding not available"), { status: 503 })
      );
      return withVerifiedCookie(jsonError(noAi.message, noAi.status));
    }

    const useCalendarPrompt = topicNeedsCalendarPrompt(topicRoute.topics);
    const includeSecondary =
      useCalendarPrompt && needsSecondaryGroupContext(sanitizedMessage, primaryGroup);
    const includeUitmSupplement =
      topicRoute.topics.includes("uitm_general") ||
      needsUitmKnowledgeSupplement(sanitizedMessage);
    const maxPrimaryChars = MAX_PRIMARY_CONTEXT_CHARS;
    const useResearchOnly =
      usesResearchStylePrompt(topicRoute.topics) && !useCalendarPrompt;

    let dataContextFull = "";
    let publicHolidayDirective = "";
    let primaryContext = "";
    let secondaryContext = "";
    let sessionListContext = "";
    let comparisonContext = multipleSessionsSelected
      ? buildComparisonContext(effectiveSessions, selectedProgram, primaryGroup)
      : "";
    let systemPrompt = "";

    if (useAgentTools) {
      sessionListContext = buildSessionListContext(primaryGroup, effectiveSessions);

      if (topicRoute.topics.includes("public_holiday")) {
        const phCtx = await buildPublicHolidayChatContext(
          sanitizedMessage,
          todayISO,
          { sessionIds: contextSessionIds }
        );
        publicHolidayDirective = phCtx.directive;
      }
    } else {
      const secondaryActivitiesRaw =
        primaryGroup === "A"
          ? getFilteredGroupBActivities(selectedProgram, [getDefaultSessionForGroup("B")])
          : getActivitiesForSession(getDefaultSessionForGroup("A"));
      const secondaryActivities = narrowActivitiesForSecondaryReference(secondaryActivitiesRaw);

      primaryContext = formatPrimaryCalendarContext(
        contextSessionIds,
        selectedProgram,
        primaryGroup,
        contextIntent,
        { useIntentFilter }
      );
      secondaryContext = formatActivitiesAsContext(secondaryActivities);
      sessionListContext = buildSessionListContext(primaryGroup, effectiveSessions);

      const [dataCtx] = await Promise.all([
        buildDataContextForTurn({
          message: sanitizedMessage,
          todayISO,
          route: topicRoute,
          contextSessionIds,
          primaryGroup,
          program: selectedProgram,
          queryScope,
          effectiveSessions,
          primaryActivities,
          contextIntent,
          useIntentFilter,
        }),
        getSystemRules(origin),
      ]);

      publicHolidayDirective = dataCtx.publicHolidayDirective;
      dataContextFull = dataCtx.dataContext;
      if (comparisonContext) {
        dataContextFull = dataContextFull
          ? `${dataContextFull}\n\n=== SESSION COMPARISON ===\n${comparisonContext}`
          : comparisonContext;
      }

      const buildLegacyContextSystemPrompt = () =>
        useResearchOnly
          ? buildResearchSystemPrompt(todayFormatted) +
            (dataContextFull ? `\n\n${dataContextFull}` : "")
          : buildChatAssistantSystemPrompt({
              programLabel,
              primaryGroup,
              secondaryGroup,
              todayFormatted,
              sessionListContext,
              primaryContext,
              secondaryContext: includeSecondary ? secondaryContext : "",
              dataContext: dataContextFull,
              topics: topicRoute.topics,
              selectedSessionCount: effectiveSessions.length,
              forceTableOutput: wantsTableOutput,
              multipleSessionsSelected,
              uitmSupplement: includeUitmSupplement ? UITM_GENERAL_INFO : "",
              includeSecondaryContext: includeSecondary,
              maxPrimaryChars,
            });

      if (useAgentPath && agentMode === "compact") {
        systemPrompt = await buildCompactFallbackSystemPrompt({
          ctx: buildAgentTurnContext({
            message: sanitizedMessage,
            todayISO,
            todayFormatted,
            program: selectedProgram,
            programLabel,
            primaryGroup,
            secondaryGroup,
            effectiveSessions,
            contextSessionIds,
            topicRoute,
            activityMatches,
            queryScope,
            contextIntent,
            useIntentFilter,
            primaryActivities,
            sessionListContext,
            comparisonContext,
            includeSecondary,
          }),
          sessionListContext,
          secondaryContext,
          comparisonContext,
          includeSecondary,
          includeUitmSupplement,
          uitmSupplement: UITM_GENERAL_INFO,
          wantsTableOutput,
          multipleSessionsSelected,
          contextIntent,
          useIntentFilter,
        });
      } else {
        systemPrompt = buildLegacyContextSystemPrompt();
      }
    }

    const agentTurnContext = buildAgentTurnContext({
      message: sanitizedMessage,
      todayISO,
      todayFormatted,
      program: selectedProgram,
      programLabel,
      primaryGroup,
      secondaryGroup,
      effectiveSessions,
      contextSessionIds,
      topicRoute,
      activityMatches,
      queryScope,
      contextIntent,
      useIntentFilter,
      primaryActivities,
      sessionListContext,
      comparisonContext,
      includeSecondary,
    });

    const modelTier = resolveWorkersAiModelTier(requestHost);
    const maxOutputTokens = getMaxOutputTokensForHost(requestHost);
    const modelBudget = getModelResponseBudget(
      sanitizedMessage,
      !useResearchOnly,
      wantsTableOutput,
      maxOutputTokens,
      { hasMatchedActivity }
    );
    const languageDirective = getLanguageTurnDirective(sanitizedMessage, sanitizedHistory);
    const understandingDirective =
      !useResearchOnly && topicRoute.topics.includes("academic_calendar")
        ? getCalendarUnderstandingDirective(sanitizedMessage)
        : "";

    const completionSuffix =
      getCompletionInstruction(isSimple, asksDetail, needsList, hasMatchedActivity) +
      understandingDirective +
      publicHolidayDirective +
      languageDirective;

    const systemPromptWithCompletion = systemPrompt + completionSuffix;

    let cachedLegacyFallbackBase: string | null = null;
    const getLegacyFallbackPromptWithCompletion = async (
      extraSuffix = ""
    ): Promise<string> => {
      if (!useAgentTools) return "";
      if (!cachedLegacyFallbackBase) {
        await getSystemRules(origin);
        const secondaryActivitiesRaw =
          primaryGroup === "A"
            ? getFilteredGroupBActivities(selectedProgram, [getDefaultSessionForGroup("B")])
            : getActivitiesForSession(getDefaultSessionForGroup("A"));
        const secondaryActivities =
          narrowActivitiesForSecondaryReference(secondaryActivitiesRaw);
        const fallbackPrimaryContext = formatPrimaryCalendarContext(
          contextSessionIds,
          selectedProgram,
          primaryGroup,
          contextIntent,
          { useIntentFilter }
        );
        const fallbackSecondaryContext = formatActivitiesAsContext(secondaryActivities);
        const fallbackSessionListContext = buildSessionListContext(
          primaryGroup,
          effectiveSessions
        );
        const { dataContext } = await buildDataContextForTurn({
          message: sanitizedMessage,
          todayISO,
          route: topicRoute,
          contextSessionIds,
          primaryGroup,
          program: selectedProgram,
          queryScope,
          effectiveSessions,
          primaryActivities,
          contextIntent,
          useIntentFilter,
        });
        let fallbackDataContextFull = dataContext;
        if (comparisonContext) {
          fallbackDataContextFull = fallbackDataContextFull
            ? `${fallbackDataContextFull}\n\n=== SESSION COMPARISON ===\n${comparisonContext}`
            : comparisonContext;
        }
        cachedLegacyFallbackBase = useResearchOnly
          ? buildResearchSystemPrompt(todayFormatted) +
            (fallbackDataContextFull ? `\n\n${fallbackDataContextFull}` : "")
          : buildChatAssistantSystemPrompt({
              programLabel,
              primaryGroup,
              secondaryGroup,
              todayFormatted,
              sessionListContext: fallbackSessionListContext,
              primaryContext: fallbackPrimaryContext,
              secondaryContext: includeSecondary ? fallbackSecondaryContext : "",
              dataContext: fallbackDataContextFull,
              topics: topicRoute.topics,
              selectedSessionCount: effectiveSessions.length,
              forceTableOutput: wantsTableOutput,
              multipleSessionsSelected,
              uitmSupplement: includeUitmSupplement ? UITM_GENERAL_INFO : "",
              includeSecondaryContext: includeSecondary,
              maxPrimaryChars,
            });
      }
      return cachedLegacyFallbackBase + completionSuffix + extraSuffix;
    };

    const validationActivityPool = !useResearchOnly
      ? getActivitiesFromSessions(loadSessions, selectedProgram, primaryGroup)
      : [];
    const allowedDates = !useResearchOnly
      ? collectAllowedDateTokens(validationActivityPool)
      : new Set<string>();
    if (!useResearchOnly) {
      addDatesFromContextText(allowedDates, dataContextFull);
      addDatesFromContextText(allowedDates, primaryContext);
    }

    const streamTokensToClient = shouldStreamTokensToClient(requestHost);

    const runPromptRetry = async (
      promptSuffix: string,
      onToken: (token: string) => void | Promise<void>,
      budget = modelBudget
    ): Promise<string> => {
      const prompt = systemPromptWithCompletion + promptSuffix;
      if (wantStream) {
        return streamAiWithRetry(
          sanitizedMessage,
          prompt,
          sanitizedHistory,
          { ...budget, requestHost, correlationId, onToken, emitTokensToClient: streamTokensToClient }
        );
      }
      return askAiWithRetry(
        sanitizedMessage,
        prompt,
        sanitizedHistory,
        { ...budget, requestHost, correlationId }
      );
    };

    const runLegacyLlm = async (
      prompt: string,
      onToken: (token: string) => void | Promise<void>,
      budget = modelBudget
    ): Promise<string> => {
      if (wantStream) {
        return streamAiWithRetry(
          sanitizedMessage,
          prompt,
          sanitizedHistory,
          { ...budget, requestHost, correlationId, onToken, emitTokensToClient: streamTokensToClient }
        );
      }
      return askAiWithRetry(
        sanitizedMessage,
        prompt,
        sanitizedHistory,
        { ...budget, requestHost, correlationId }
      );
    };

    const resolveAgentReplyWithFallback = async (
      agentReply: string,
      toolsUsed: string[],
      onToken: (token: string) => void | Promise<void>,
      extraSuffix = ""
    ): Promise<string> => {
      if (agentReply.trim()) return agentReply;
      const legacyPrompt = await getLegacyFallbackPromptWithCompletion(extraSuffix);
      if (!legacyPrompt.trim()) return agentReply;
      logger.warn("Chat agent empty reply, using legacy context fallback", {
        correlationId,
        toolsUsed,
      });
      return runLegacyLlm(legacyPrompt, onToken);
    };

    const runLlm = async (
      onToken: (token: string) => void | Promise<void>,
      onProgress?: {
        onToolStep?: (step: number, maxSteps: number) => void | Promise<void>;
        onSynthesis?: () => void | Promise<void>;
        /** Clear client partial content before a regenerate. */
        onRetry?: (reason: string) => void | Promise<void>;
      }
    ): Promise<string> => {
      const turnStartMs = Date.now();
      let turnToolsUsed: string[] = [];
      let rawReply: string;
      if (useAgentTools) {
        const agentResult = await askAgentWithRetry({
          userMessage: sanitizedMessage,
          history: sanitizedHistory,
          ctx: agentTurnContext,
          requestHost,
          correlationId,
          maxTokens: modelBudget.maxTokens,
          temperature: modelBudget.temperature,
          extraSystemDirectives: systemPromptWithCompletion,
          onToken,
          emitTokensToClient: streamTokensToClient,
          onToolStep: onProgress?.onToolStep,
          onSynthesis: onProgress?.onSynthesis,
        });
        turnToolsUsed = agentResult.toolsUsed;
        logger.info("Chat agent reply", {
          correlationId,
          agentMode,
          executionMode,
          toolsUsed: agentResult.toolsUsed,
          durationMs: Date.now() - turnStartMs,
        });
        rawReply = await resolveAgentReplyWithFallback(
          agentResult.reply,
          agentResult.toolsUsed,
          onToken
        );
      } else if (wantStream) {
        rawReply = await streamAiWithRetry(
          sanitizedMessage,
          systemPromptWithCompletion,
          sanitizedHistory,
          { ...modelBudget, requestHost, correlationId, onToken, emitTokensToClient: streamTokensToClient }
        );
      } else {
        rawReply = await askAiWithRetry(
          sanitizedMessage,
          systemPromptWithCompletion,
          sanitizedHistory,
          { ...modelBudget, requestHost, correlationId }
        );
      }

      if (
        !useResearchOnly &&
        !hasMatchedActivity &&
        allowedDates.size > 0 &&
        !(useAgentTools && agentUsedCalendarTools(turnToolsUsed)) &&
        replyHasUnknownCalendarDates(rawReply, allowedDates)
      ) {
        await onProgress?.onRetry?.("dates");
        if (useAgentTools) {
          rawReply = await runPromptRetry(DATE_VALIDATION_RETRY_NUDGE, onToken);
        } else if (wantStream) {
          rawReply = await streamAiWithRetry(
            sanitizedMessage,
            systemPromptWithCompletion + DATE_VALIDATION_RETRY_NUDGE,
            sanitizedHistory,
            { ...modelBudget, requestHost, correlationId, onToken, emitTokensToClient: streamTokensToClient }
          );
        } else {
          rawReply = await askAiWithRetry(
            sanitizedMessage,
            systemPromptWithCompletion + DATE_VALIDATION_RETRY_NUDGE,
            sanitizedHistory,
            { ...modelBudget, requestHost, correlationId }
          );
        }
      }

      const cleanedFirst = normalizeAssistantTables(cleanAiReply(rawReply));
      const incomplete = detectIncompleteReply(cleanedFirst, needsList || asksDetail);
      if (incomplete) {
        await onProgress?.onRetry?.("incomplete");
        const bumpedBudget = {
          ...modelBudget,
          maxTokens: maxOutputTokens,
        };
        let retryReply: string;
        if (useAgentTools) {
          retryReply = await runPromptRetry(
            REPLY_COMPLETION_RETRY_NUDGE,
            onToken,
            bumpedBudget
          );
        } else if (wantStream) {
          retryReply = await streamAiWithRetry(
            sanitizedMessage,
            systemPromptWithCompletion + REPLY_COMPLETION_RETRY_NUDGE,
            sanitizedHistory,
            {
              ...bumpedBudget,
              requestHost,
              correlationId,
              onToken,
              emitTokensToClient: streamTokensToClient,
            }
          );
        } else {
          retryReply = await askAiWithRetry(
            sanitizedMessage,
            systemPromptWithCompletion + REPLY_COMPLETION_RETRY_NUDGE,
            sanitizedHistory,
            { ...bumpedBudget, requestHost, correlationId }
          );
        }
        const cleanedRetry = normalizeAssistantTables(cleanAiReply(retryReply));
        if (cleanedRetry.length >= cleanedFirst.length) {
          logger.info("Chat turn completed", {
            correlationId,
            executionMode,
            toolsUsed: turnToolsUsed,
            retried: "incomplete",
            durationMs: Date.now() - turnStartMs,
          });
          return cleanedRetry;
        }
      }

      logger.info("Chat turn completed", {
        correlationId,
        executionMode,
        toolsUsed: turnToolsUsed,
        durationMs: Date.now() - turnStartMs,
      });
      return cleanedFirst;
    };

    if (wantStream) {
      const sseStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const encoder = new TextEncoder();
          const enqueue = (text: string) => controller.enqueue(encoder.encode(text));
          try {
            const onToken = streamTokensToClient
              ? (token: string) => {
                  enqueue(encodeSseEvent("token", { token }));
                }
              : () => {};
            const onToolStep = (step: number, maxSteps: number) => {
              enqueue(
                encodeSseEvent("status", {
                  phase: "searching",
                  message: `Searching calendar… (${step + 1}/${maxSteps})`,
                })
              );
            };
            const onSynthesis = () => {
              enqueue(
                encodeSseEvent("status", {
                  phase: "generating",
                  message: "Writing your answer…",
                })
              );
            };
            const onRetry = (reason: string) => {
              enqueue(encodeSseEvent("reset", { reason }));
              enqueue(
                encodeSseEvent("status", {
                  phase: "retry",
                  message: "Refining your answer…",
                })
              );
            };
            enqueue(
              encodeSseEvent("status", {
                phase: useAgentTools ? "searching" : "generating",
                message: useAgentTools ? "Searching calendar…" : "Thinking…",
              })
            );
            const reply = await runWithServerDeadline(
              useAgentTools ? CHAT_AGENT_DEADLINE_MS : CHAT_SERVER_DEADLINE_MS,
              () => runLlm(onToken, { onToolStep, onSynthesis, onRetry })
            );
            setCachedReply(cacheKey, reply);
            enqueue(
              encodeSseEvent("done", {
                reply,
                correlationId,
              })
            );
            controller.close();
          } catch (error) {
            const mapped = mapChatError(error);
            logger.error("Chat stream error", {
              correlationId,
              errMsg: mapped.message,
              status: mapped.status,
              cause: error instanceof Error ? error.message : String(error),
              modelTier,
              modelChain: modelChain.join(" → "),
              agentMode,
              executionMode,
            });
            enqueue(encodeSseEvent("error", { error: mapped.message, status: mapped.status }));
            controller.close();
          }
        },
      });

      const response = new NextResponse(sseStream, { headers: SSE_HEADERS });
      return withVerifiedCookie(response);
    }

    const reply = await runLlm(() => undefined);
    setCachedReply(cacheKey, reply);
    return withVerifiedCookie(jsonChatReply(reply, correlationId, "llm"));
  } catch (error: unknown) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message?.includes("JSON"))) {
      return withVerifiedCookie(jsonError("Invalid JSON in request body", 400));
    }
    const mapped = mapChatError(error);
    const requestHost = request.headers.get("host");
    logger.error("Chat API error", {
      correlationId,
      errMsg: mapped.message,
      status: mapped.status,
      cause: error instanceof Error ? error.message : String(error),
      modelTier: resolveWorkersAiModelTier(requestHost),
      modelChain: resolveProductionChatModelChain(requestHost).join(" → "),
    });
    return withVerifiedCookie(jsonError(mapped.message, mapped.status));
  }
}

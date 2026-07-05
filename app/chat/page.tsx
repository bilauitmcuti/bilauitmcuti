"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useCalendarHydrationVersion } from "@/components/calendar-hydration-context";
import { getSnapshot, subscribe } from "@/lib/calendar-store";
import {
  formatGroupASessionTriggerLabel,
  formatSessionLabelWithId,
  getProgramOptions,
  getSessionOptionsForGroup,
  getGroupFromSession,
} from "@/lib/data";
import type { SessionId } from "@/lib/data";
import { getFiltersFromCookie, setFiltersToCookie } from "@/lib/cookie-utils";
import { getRoutePath, isProgramValue, type ProgramValue } from "@/lib/route-utils";
import {
  CHAT_RETURN_PATH_KEY,
  clearChatReturnPath,
  isValidChatReturnPath,
  markChatStoreResync,
  readChatCalendarContext,
  resolveChatBackPath,
  resolveProgramFromCalendarPath,
} from "@/lib/session-query";
import {
  areSessionListsEqual,
  getGroupFromProgram,
  getSessionMemoryKey,
  normalizeSessionsForGroup,
} from "@/lib/session-memory";
import { cn } from "@/lib/utils";
import { trackZarazEvent, ZARAZ_EVENTS } from "@/lib/zaraz";
import { useTurnstileSiteKeyFromContext } from "@/hooks/use-turnstile-site-key";
import { useEngagementPrompt } from "@/components/engagement-prompt";
import type { TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatComposer } from "@/components/chat/chat-composer";
import { useChatGreeting } from "@/hooks/use-chat-greeting";
import { getRandomSuggestions } from "@/components/chat/suggestion-data";
import { useDesktopViewport } from "@/lib/use-mobile-viewport";
import {
  CHAT_TURNSTILE_COOKIE,
  FETCH_TIMEOUT_MS,
  RETRY_DELAYS_MS,
  escapeRegExp,
  getActiveMentionMatch,
  getChatErrorMessage,
  getRandomLoadingPhrase,
  consumeChatStream,
  LOADING_INDICATOR_DELAY_MS,
  MAX_CHAT_MESSAGE_LENGTH,
  parseChatResponse,
  prepareHistory,
  type ChatMessageItem,
  type MentionMatch,
} from "@/components/chat/chat-utils";
import {
  getInitialChatSessions,
  mergeSessionMapsFromHomepage,
  resolveSessionsForProgram,
  type ProgramSessionMap,
} from "@/lib/chat/session-state";
type Message = ChatMessageItem;

interface MentionItem {
  id: SessionId;
  label: string;
  text: string;
}

export default function ChatPage() {
  const hydrationServerVersion = useCalendarHydrationVersion();
  useSyncExternalStore(
    subscribe,
    () => getSnapshot().version,
    () => hydrationServerVersion
  );

  const router = useRouter();
  const { recordEngagementAction } = useEngagementPrompt();
  const chatGreeting = useChatGreeting();
  const isDesktopViewport = useDesktopViewport();
  const programOptions = getProgramOptions();
  const calendarDataVersion = getSnapshot().version;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const [isTurnstileSessionVerified, setIsTurnstileSessionVerified] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramValue>("All");
  const [selectedSessions, setSelectedSessions] = useState<SessionId[]>(() =>
    getInitialChatSessions("All")
  );
  const [sessionsByProgram, setSessionsByProgram] = useState<ProgramSessionMap>(() => ({
    All: getInitialChatSessions("All"),
  }));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const keepDropdownOpenRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const currentGroup = getGroupFromProgram(selectedProgram);
  const suggestionGroup = useMemo((): "A" | "B" => {
    const opt = getProgramOptions().find((p) => p.value === selectedProgram);
    return opt?.group ?? getGroupFromProgram(selectedProgram);
  }, [selectedProgram, calendarDataVersion]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null);
  const [isMobileMentionPicker, setIsMobileMentionPicker] = useState(false);

  const { siteKey: turnstileSiteKey, isReady: isTurnstileConfigReady } =
    useTurnstileSiteKeyFromContext();
  const requiresTurnstile = Boolean(turnstileSiteKey) && !isTurnstileSessionVerified;
  const waitForTurnstileConfig =
    process.env.NODE_ENV === "production" && !isTurnstileConfigReady;
  /** Hide widget as soon as Turnstile returns a token; keeps "Verifying..." off-screen during fetch. */
  const showTurnstileChallenge = requiresTurnstile && !turnstileToken.trim();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasVerifiedCookie = document.cookie
      .split(";")
      .some((item) => item.trim().startsWith(`${CHAT_TURNSTILE_COOKIE}=1`));
    if (hasVerifiedCookie) setIsTurnstileSessionVerified(true);
  }, []);

  const hydrateChatFromHomepageSources = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const filters = getFiltersFromCookie();
      const calendarContext = readChatCalendarContext();
      const returnPath = sessionStorage.getItem(CHAT_RETURN_PATH_KEY);
      const programFromReturnPath =
        returnPath && isValidChatReturnPath(returnPath)
          ? resolveProgramFromCalendarPath(returnPath)
          : ("All" as ProgramValue);

      const raw =
        localStorage.getItem("sessionIdsByProgram") ??
        localStorage.getItem("chatSessionIdsByProgram");
      const parsed = raw
        ? (JSON.parse(raw) as Partial<Record<ProgramValue, SessionId[]>>)
        : null;

      const merged = mergeSessionMapsFromHomepage(parsed, filters);
      const dateStr = new Date().toISOString().slice(0, 10);
      const mergedMap: ProgramSessionMap = {
        All: getInitialChatSessions("All"),
        ...merged,
      };

      const storedProgram = localStorage.getItem("selectedProgram");
      let nextProgram: ProgramValue;
      if (calendarContext) {
        nextProgram = calendarContext.selectedProgram;
      } else if (programFromReturnPath !== "All") {
        nextProgram = programFromReturnPath;
      } else if (filters.selectedProgram && isProgramValue(filters.selectedProgram)) {
        nextProgram = filters.selectedProgram;
      } else if (storedProgram && isProgramValue(storedProgram)) {
        nextProgram = storedProgram;
      } else {
        nextProgram = "All";
      }

      if (calendarContext) {
        const group = getGroupFromProgram(calendarContext.selectedProgram);
        const memKey = getSessionMemoryKey(calendarContext.selectedProgram);
        const fromContext = normalizeSessionsForGroup(
          calendarContext.selectedSessions,
          group
        );
        if (fromContext.length > 0) {
          mergedMap[memKey] = fromContext;
        }
      }

      let resolvedSessions: SessionId[];
      if (calendarContext) {
        const group = getGroupFromProgram(calendarContext.selectedProgram);
        const fromContext = normalizeSessionsForGroup(
          calendarContext.selectedSessions,
          group
        );
        resolvedSessions =
          fromContext.length > 0
            ? fromContext
            : resolveSessionsForProgram(nextProgram, [], mergedMap, dateStr);
      } else {
        resolvedSessions = resolveSessionsForProgram(
          nextProgram,
          [],
          mergedMap,
          dateStr
        );
      }

      setSessionsByProgram(mergedMap);
      setSelectedProgram(nextProgram);
      setSelectedSessions(resolvedSessions);
    } catch {
      // Ignore parse errors and continue with defaults.
    }
  }, []);

  useLayoutEffect(() => {
    hydrateChatFromHomepageSources();
    hasHydratedRef.current = true;
  }, [hydrateChatFromHomepageSources]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    hydrateChatFromHomepageSources();
  }, [hydrateChatFromHomepageSources, calendarDataVersion]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") hydrateChatFromHomepageSources();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "sessionIdsByProgram" || e.key === "selectedProgram") {
        hydrateChatFromHomepageSources();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [hydrateChatFromHomepageSources]);

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === "undefined") return;
    try {
      localStorage.setItem("sessionIdsByProgram", JSON.stringify(sessionsByProgram));
      localStorage.setItem("chatSessionIdsByProgram", JSON.stringify(sessionsByProgram));
    } catch {
      // Ignore storage errors (private mode / quota).
    }
  }, [sessionsByProgram]);

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === "undefined") return;
    try {
      localStorage.setItem("selectedProgram", selectedProgram);
    } catch {
      // Ignore storage errors (private mode / quota).
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const filters = getFiltersFromCookie();
    setFiltersToCookie({
      ...filters,
      selectedProgram,
      sessionId: selectedSessions[0],
      sessionIds: selectedSessions,
      sessionIdsByProgram: sessionsByProgram,
    });
  }, [selectedProgram, selectedSessions, sessionsByProgram]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CHAT_RETURN_PATH_KEY);
      if (stored && isValidChatReturnPath(stored)) {
        router.prefetch(stored);
      }
    } catch {
      // Ignore storage errors.
    }
    router.prefetch(getRoutePath(selectedProgram, "grid"));
    router.prefetch(getRoutePath(selectedProgram, "list"));
  }, [router, selectedProgram]);

  const handleChatBack = useCallback(() => {
    const context = readChatCalendarContext();
    const target = resolveChatBackPath(context?.selectedProgram ?? selectedProgram);
    const program =
      context?.selectedProgram ?? resolveProgramFromCalendarPath(target);
    const sessions = context?.selectedSessions ?? selectedSessions;

    const filters = getFiltersFromCookie();
    const sessionMemoryKey = getSessionMemoryKey(program);
    setFiltersToCookie({
      ...filters,
      selectedProgram: program,
      sessionId: sessions[0],
      sessionIds: sessions,
      sessionIdsByProgram: {
        ...(filters.sessionIdsByProgram ?? {}),
        ...sessionsByProgram,
        [sessionMemoryKey]: sessions,
      },
    });

    markChatStoreResync();
    clearChatReturnPath();
    router.push(target);
  }, [router, selectedProgram, selectedSessions, sessionsByProgram]);

  // Sync selectedSessions when program changes using per-program memory.
  useEffect(() => {
    const dateStr =
      typeof window !== "undefined" ? new Date().toISOString().slice(0, 10) : "2026-03-15";
    setSelectedSessions((prev) => {
      const resolved = resolveSessionsForProgram(
        selectedProgram,
        [],
        sessionsByProgram,
        dateStr
      );
      return areSessionListsEqual(prev, resolved) ? prev : resolved;
    });
  }, [selectedProgram, sessionsByProgram]);

  // Randomize suggestions on mount and when program/group changes (pool follows programOptions.group)
  useLayoutEffect(() => {
    setSuggestions(getRandomSuggestions(suggestionGroup, []));
  }, [suggestionGroup]);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const [showThinkingIndicator, setShowThinkingIndicator] = useState(false);
  const thinkingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearThinkingDelay = useCallback(() => {
    if (thinkingDelayRef.current) {
      clearTimeout(thinkingDelayRef.current);
      thinkingDelayRef.current = null;
    }
  }, []);

  const startThinkingDelay = useCallback(() => {
    clearThinkingDelay();
    setShowThinkingIndicator(false);
    thinkingDelayRef.current = setTimeout(() => {
      setShowThinkingIndicator(true);
    }, LOADING_INDICATOR_DELAY_MS);
  }, [clearThinkingDelay]);

  const handleSessionToggle = useCallback(
    (programValue: ProgramValue, sessionId: SessionId, group: "A" | "B") => {
      const dateStr =
        typeof window !== "undefined" ? new Date().toISOString().slice(0, 10) : "2026-03-15";
      setSelectedProgram(programValue);
      setSelectedSessions((prev) => {
        const baseSessions = resolveSessionsForProgram(
          programValue,
          [],
          sessionsByProgram,
          dateStr
        );
        const inGroup = baseSessions.filter((id) => id.startsWith(`${group}-`));
        const isSelected = inGroup.includes(sessionId);
        if (isSelected && inGroup.length > 1) {
          const next = inGroup.filter((id) => id !== sessionId);
          const sessionMemoryKey = getSessionMemoryKey(programValue);
          setSessionsByProgram((prevMap) => ({ ...prevMap, [sessionMemoryKey]: next }));
          return next;
        }
        if (!isSelected) {
          const next = [...inGroup, sessionId];
          const sessionMemoryKey = getSessionMemoryKey(programValue);
          setSessionsByProgram((prevMap) => ({ ...prevMap, [sessionMemoryKey]: next }));
          return next;
        }
        const sessionMemoryKey = getSessionMemoryKey(programValue);
        setSessionsByProgram((prevMap) => ({ ...prevMap, [sessionMemoryKey]: inGroup }));
        return inGroup;
      });
      recordEngagementAction("session_change");
    },
    [sessionsByProgram, recordEngagementAction]
  );

  const handleProgramSelect = useCallback((program: ProgramValue) => {
    const dateStr =
      typeof window !== "undefined" ? new Date().toISOString().slice(0, 10) : "2026-03-15";
    setSelectedProgram(program);
    const resolved = resolveSessionsForProgram(program, [], sessionsByProgram, dateStr);
    setSelectedSessions(resolved);
    recordEngagementAction("program_change");
  }, [sessionsByProgram, recordEngagementAction]);

  const currentProgramLabel = useMemo(() => {
    const opt = programOptions.find((p) => p.value === selectedProgram);
    return opt?.label ?? "All";
  }, [selectedProgram, programOptions]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const lastScrollTop = useRef(0);
  const groupAOptions = useMemo(() => programOptions.filter(p => p.group === 'A'), [programOptions]);
  const groupBOptions = useMemo(() => programOptions.filter(p => p.group === 'B'), [programOptions]);
  const groupBProgramForSessions = groupBOptions.some((p) => p.value === selectedProgram)
    ? selectedProgram
    : ("All" as ProgramValue);
  const groupBSessionLabel = useMemo(() => {
    void calendarDataVersion;
    if (currentGroup === "A") return "";
    const labels = selectedSessions
      .filter((sessionId) => sessionId.startsWith("B-"))
      .map((sessionId) => {
        const session = getSessionOptionsForGroup("B").find((item) => item.id === sessionId);
        return session ? formatSessionLabelWithId(session) : sessionId;
      });
    if (labels.length === 0) return "Select sessions";
    if (labels.length === 1) return labels[0];
    return `${labels.length} Selected`;
  }, [currentGroup, selectedSessions, calendarDataVersion]);
  const allMentionTexts = useMemo(() => {
    const groupA = getSessionOptionsForGroup("A").map((session) => formatSessionLabelWithId(session));
    const groupB = getSessionOptionsForGroup("B").map((session) => formatSessionLabelWithId(session));
    return [...groupA, ...groupB].sort((left, right) => right.length - left.length);
  }, [calendarDataVersion]);

  const mentionHighlightPattern = useMemo(() => {
    if (allMentionTexts.length === 0) return null;
    const escaped = allMentionTexts.map((item) => escapeRegExp(item));
    return new RegExp(`(${escaped.join("|")})`, "g");
  }, [allMentionTexts]);
  const mentionItems = useMemo<MentionItem[]>(() => {
    const sessions = getSessionOptionsForGroup(currentGroup);
    const normalizedQuery = mentionQuery.trim().toLowerCase();
    const mapped = sessions.map((session) => ({
      id: session.id,
      label: session.label,
      text: formatSessionLabelWithId(session),
    }));
    if (!normalizedQuery) return mapped;
    return mapped.filter((item) => {
      const haystack = `${item.label} ${item.id} ${item.text}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [currentGroup, mentionQuery, calendarDataVersion]);

  // Auto-resize textarea to fit content up to max height
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, []);

  const handleMentionSelect = useCallback((item: MentionItem) => {
    const textarea = textareaRef.current;
    if (!textarea || !mentionMatch) return;
    const nextValue = `${input.slice(0, mentionMatch.start)}${item.text} ${input.slice(mentionMatch.end)}`;
    const nextCaret = mentionMatch.start + item.text.length + 1;
    setInput(nextValue);
    setIsMentionOpen(false);
    setMentionMatch(null);
    setMentionQuery("");
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
      adjustTextareaHeight();
    }, 0);
  }, [input, mentionMatch, adjustTextareaHeight]);

  const lastUserMsgId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].id;
    }
    return null;
  }, [messages]);

  const showLoadingMarker = useMemo(() => {
    const isAwaitingAssistant = messages.some(
      (m) => m.role === "assistant" && m.isComplete === false
    );
    const hasStreamingContent = messages.some(
      (m) =>
        m.role === "assistant" &&
        m.isComplete === false &&
        m.content.trim().length > 0
    );

    return (
      isLoading &&
      ((showThinkingIndicator && !isAwaitingAssistant) ||
        (isAwaitingAssistant && !hasStreamingContent))
    );
  }, [isLoading, showThinkingIndicator, messages]);

  useEffect(() => {
    if (!showLoadingMarker) {
      setLoadingPhrase("");
      return;
    }
    setLoadingPhrase(getRandomLoadingPhrase());
    const interval = setInterval(() => {
      setLoadingPhrase((prev) => getRandomLoadingPhrase(prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [showLoadingMarker]);

  useEffect(() => () => clearThinkingDelay(), [clearThinkingDelay]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleViewportScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const currentScrollTop = el.scrollTop;
      if (dropdownOpen) {
        setDropdownOpen(false);
        setActiveSubmenu(null);
      }
      if (currentScrollTop <= 10 || currentScrollTop < lastScrollTop.current) {
        setHeaderVisible(true);
      } else if (currentScrollTop > lastScrollTop.current) {
        setHeaderVisible(false);
      }
      lastScrollTop.current = currentScrollTop;
    },
    [dropdownOpen]
  );

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || waitForTurnstileConfig) return;
    if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) return;
    if (requiresTurnstile && !turnstileToken.trim()) {
      turnstileRef.current?.execute();
      return;
    }

    const now = Date.now();
    const userMessage: Message = {
      id: now.toString(),
      role: "user",
      content: trimmed,
      timestamp: now,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    startThinkingDelay();
    recordEngagementAction("chat_send");
    let didAttemptFetch = false;

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const offlineNow = Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: (offlineNow + 1).toString(),
            role: "assistant",
            content:
              "Tiada sambungan internet. Semak rangkaian anda dan cuba lagi. / No internet connection. Check your network and try again.",
            timestamp: offlineNow,
          },
        ]);
        return;
      }

      didAttemptFetch = true;
      const history = prepareHistory(messages);

      const trimmedToken = turnstileToken.trim();
      const body = JSON.stringify({
        message: trimmed,
        program: selectedProgram,
        selectedSessions,
        history,
        stream: true,
        turnstileToken: trimmedToken ? trimmedToken : undefined,
      });
      let content: string | null = null;
      let correlationId: string | undefined;
      let maxAttempts = 3;
      let chatRequestSucceeded = false;
      let usedStreamPlaceholder = false;
      const assistantId = (now + 1).toString();
      const isRetryableStatus = (s: number) =>
        s === 429 || s === 500 || s === 502 || s === 503 || s === 504;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
          const res = await fetch("/chat/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: controller.signal,
            credentials: "include",
          });
          clearTimeout(timeoutId);

          const responseType = res.headers.get("content-type") ?? "";

          if (responseType.includes("text/event-stream")) {
            if (!res.ok) {
              content = getChatErrorMessage(res, "Something went wrong. Please try again.");
              break;
            }

            usedStreamPlaceholder = true;

            setMessages((prev) => {
              if (prev.some((m) => m.id === assistantId)) return prev;
              return [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  isComplete: false,
                  timestamp: Date.now(),
                },
              ];
            });
            await consumeChatStream(res, {
              onToken: (token) => {
                clearThinkingDelay();
                setShowThinkingIndicator(false);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + token }
                      : m
                  )
                );
              },
              onDone: (payload) => {
                content = payload.reply;
                chatRequestSucceeded = true;
                clearThinkingDelay();
                setShowThinkingIndicator(false);
                const doneAt = Date.now();
                const replyText = payload.reply ?? "";

                setMessages((prev) => {
                  const hasMsg = prev.some((m) => m.id === assistantId);
                  if (!hasMsg) {
                    return [
                      ...prev,
                      {
                        id: assistantId,
                        role: "assistant",
                        content: replyText,
                        correlationId: payload.correlationId,
                        userPrompt: trimmed,
                        isComplete: true,
                        timestamp: doneAt,
                      },
                    ];
                  }
                  return prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: replyText,
                          correlationId: payload.correlationId,
                          userPrompt: trimmed,
                          isComplete: true,
                          timestamp: doneAt,
                        }
                      : m
                  );
                });
                setIsTurnstileSessionVerified(true);
                setTurnstileToken("");
                turnstileRef.current?.reset();
              },
              onError: (payload) => {
                content = payload.error;
                if (payload.status === 503 && maxAttempts === 3) {
                  maxAttempts = 4;
                }
              },
            });
            break;
          }

          const data = await parseChatResponse(res);

          if (!res.ok) {
            content = data.error || getChatErrorMessage(res, "Something went wrong. Please try again.");
            if (res.status === 503 && maxAttempts === 3) {
              maxAttempts = 4;
            }
            if (isRetryableStatus(res.status) && attempt < maxAttempts - 1) {
              await new Promise((r) =>
                setTimeout(
                  r,
                  RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
                )
              );
              continue;
            }
          } else {
            clearThinkingDelay();
            setShowThinkingIndicator(false);
            content = data.reply || "Sorry, I could not get a response.";
            correlationId = data.correlationId;
            chatRequestSucceeded = true;
            setIsTurnstileSessionVerified(true);
            setTurnstileToken("");
            turnstileRef.current?.reset();
          }
          break;
        } catch (err) {
          clearTimeout(timeoutId);
          const isAbort = err instanceof Error && err.name === "AbortError";
          content = isAbort
            ? "Request timed out. Please try again."
            : "Something went wrong. Please try again.";
          if (attempt < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
            continue;
          }
          break;
        }
      }

      if (didAttemptFetch && !chatRequestSucceeded && trimmedToken) {
        setTurnstileToken("");
        setTurnstileNonce((n) => n + 1);
      }

      if (!chatRequestSucceeded) {
        const assistantNow = Date.now();
        const errorContent = content || "Something went wrong. Please try again.";
        setMessages((prev) => {
          const hasPlaceholder = prev.some((m) => m.id === assistantId);
          if (hasPlaceholder) {
            return prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: errorContent,
                    timestamp: assistantNow,
                    isComplete: true,
                  }
                : m
            );
          }
          return [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: errorContent,
              timestamp: assistantNow,
              isComplete: true,
            },
          ];
        });
      } else if (!usedStreamPlaceholder) {
        const assistantNow = Date.now();
        const assistantMessage: Message = {
          id: assistantId,
          role: "assistant",
          content: content || "Sorry, I could not get a response.",
          timestamp: assistantNow,
          userPrompt: trimmed,
          correlationId,
          isComplete: true,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === assistantId)) return prev;
          return [...prev, assistantMessage];
        });
      }

      if (chatRequestSucceeded) {
        trackZarazEvent(ZARAZ_EVENTS.chatMessageSent, {
          program: selectedProgram,
          sessionCount: selectedSessions.length,
        });
      }
    } catch {
      const errorNow = Date.now();
      const errorMessage: Message = {
        id: (errorNow + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: errorNow,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      clearThinkingDelay();
      setShowThinkingIndicator(false);
      setIsLoading(false);
    }
  }, [
    clearThinkingDelay,
    isLoading,
    isTurnstileSessionVerified,
    messages,
    recordEngagementAction,
    requiresTurnstile,
    selectedProgram,
    selectedSessions,
    startThinkingDelay,
    turnstileToken,
    waitForTurnstileConfig,
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentionOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (mentionItems.length === 0) return;
        setActiveMentionIndex((prev) => (prev + 1) % mentionItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (mentionItems.length === 0) return;
        setActiveMentionIndex((prev) => (prev - 1 + mentionItems.length) % mentionItems.length);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMentionOpen(false);
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && mentionItems.length > 0) {
        e.preventDefault();
        const target = mentionItems[activeMentionIndex] ?? mentionItems[0];
        if (!target) return;
        handleMentionSelect(target);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const updateMentionState = useCallback((value: string, caretIndex: number | null) => {
    if (caretIndex == null) {
      setIsMentionOpen(false);
      setMentionMatch(null);
      setMentionQuery("");
      return;
    }
    const match = getActiveMentionMatch(value, caretIndex);
    if (!match) {
      setIsMentionOpen(false);
      setMentionMatch(null);
      setMentionQuery("");
      return;
    }
    setMentionMatch(match);
    setMentionQuery(match.query);
    setActiveMentionIndex(0);
    setIsMentionOpen(true);
    recordEngagementAction("chat_mention_open");
  }, [recordEngagementAction]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobileMentionPicker(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const mentionHighlightParts = useMemo(() => {
    if (!mentionHighlightPattern || !input) return [{ text: input, isMention: false }];
    const parts: { text: string; isMention: boolean }[] = [];
    let lastIndex = 0;
    input.replace(mentionHighlightPattern, (match, _group, offset) => {
      if (offset > lastIndex) parts.push({ text: input.slice(lastIndex, offset), isMention: false });
      parts.push({ text: match, isMention: true });
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < input.length) parts.push({ text: input.slice(lastIndex), isMention: false });
    return parts;
  }, [input, mentionHighlightPattern]);

  useEffect(() => {
    if (!isMentionOpen) return;
    if (mentionItems.length === 0) {
      setActiveMentionIndex(0);
      return;
    }
    if (activeMentionIndex <= mentionItems.length - 1) return;
    setActiveMentionIndex(0);
  }, [isMentionOpen, mentionItems, activeMentionIndex]);

  const handleCopy = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: ignore if clipboard API fails
    }
  };

  const handleReaction = async (msgId: string, type: "up" | "down") => {
    const nextReaction = reactions[msgId] === type ? null : type;
    setReactions((prev) => ({
      ...prev,
      [msgId]: nextReaction,
    }));

    if (!nextReaction || feedbackSent[msgId]) return;

    const assistantMsg = messages.find((m) => m.id === msgId);
    if (!assistantMsg || assistantMsg.role !== "assistant" || !assistantMsg.content.trim()) {
      setFeedbackError("Feedback is not available for this message yet.");
      return;
    }

    const msgIndex = messages.findIndex((m) => m.id === msgId);
    const userMsg =
      msgIndex > 0 && messages[msgIndex - 1]?.role === "user"
        ? messages[msgIndex - 1]
        : null;
    const userMessage =
      assistantMsg.userPrompt ?? userMsg?.content ?? "";

    try {
      const res = await fetch("/chat/feedback/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating: nextReaction,
          correlationId: assistantMsg.correlationId ?? undefined,
          userMessage,
          assistantMessage: assistantMsg.content,
          program: selectedProgram,
          selectedSessions,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setFeedbackError(data.error ?? "Could not send feedback. Please try again.");
        return;
      }
      setFeedbackSent((prev) => ({ ...prev, [msgId]: true }));
      setFeedbackError(null);
      trackZarazEvent(ZARAZ_EVENTS.chatFeedback, { rating: nextReaction });
    } catch {
      setFeedbackError("Could not send feedback. Please try again.");
    }
  };

  const handleDelete = useCallback((msgId: string) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msgId);
      if (idx === -1) return prev;
      const target = prev[idx];
      const next = prev[idx + 1];
      const removePairedAssistant =
        target.role === "user" && next?.role === "assistant";
      const removeCount = removePairedAssistant ? 2 : 1;
      return [...prev.slice(0, idx), ...prev.slice(idx + removeCount)];
    });
  }, []);

  const handleEdit = useCallback((msgId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;
    const msg = messages[msgIndex];
    setInput(msg.content);
    setMessages(messages.slice(0, msgIndex));
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, [messages]);

  const isEmptyChat = messages.length === 0;

  const chatInputPlaceholder = useMemo(() => {
    if (!isEmptyChat) return "Write a message...";
    if (isDesktopViewport) {
      return "Ask about calendars or holidays. Select your programme, or type @ to mention one.";
    }
    return "How can I help you today?";
  }, [isEmptyChat, isDesktopViewport]);

  const handleChatBack = useCallback(() => {
    const target = resolveChatBackPath(selectedProgram);
    clearChatReturnPath();
    router.push(target);
  }, [router, selectedProgram]);

  return (
    <div className="relative flex flex-col h-dvh overflow-x-hidden bg-background text-foreground" data-nosnippet>
      {/* Header - overlays on top of chat area */}
      <div className={`chat-header absolute top-0 left-0 right-0 z-10 px-4 md:px-0 ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <header className="flex items-center gap-3 pt-8 pb-3 mx-auto max-w-[600px] w-full">
          <button
            onClick={handleChatBack}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 dark:bg-[#2A2A2A] dark:hover:bg-[#333] transition-colors"
            aria-label="Back to calendar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </header>
      </div>

      {/* Chat area + composer */}
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden px-1 md:px-0",
          isEmptyChat && "lg:justify-center lg:gap-16"
        )}
      >
        {isEmptyChat ? (
          <ChatEmptyState
            greeting={chatGreeting}
            showTurnstileChallenge={showTurnstileChallenge}
            turnstileSiteKey={turnstileSiteKey ?? ""}
            turnstileNonce={turnstileNonce}
            turnstileRef={turnstileRef}
            onTurnstileToken={setTurnstileToken}
          />
        ) : (
          <ChatTranscript
            messages={messages}
            isLoading={isLoading}
            showLoadingMarker={showLoadingMarker}
            loadingPhrase={loadingPhrase}
            lastUserMsgId={lastUserMsgId}
            copiedId={copiedId}
            reactions={reactions}
            showTurnstileChallenge={showTurnstileChallenge}
            turnstileSiteKey={turnstileSiteKey ?? ""}
            turnstileNonce={turnstileNonce}
            turnstileRef={turnstileRef}
            onTurnstileToken={setTurnstileToken}
            onViewportScroll={handleViewportScroll}
            onCopy={handleCopy}
            onReaction={handleReaction}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <ChatComposer
          isEmptyChat={isEmptyChat}
          input={input}
          placeholder={chatInputPlaceholder}
          isLoading={isLoading}
          waitForTurnstileConfig={waitForTurnstileConfig}
          requiresTurnstile={requiresTurnstile}
          turnstileToken={turnstileToken}
          feedbackError={feedbackError}
          suggestions={suggestions}
          mentionHighlightParts={mentionHighlightParts}
          isMentionOpen={isMentionOpen}
          isMobileMentionPicker={isMobileMentionPicker}
          mentionItems={mentionItems}
          activeMentionIndex={activeMentionIndex}
          dropdownOpen={dropdownOpen}
          activeSubmenu={activeSubmenu}
          currentProgramLabel={currentProgramLabel}
          groupAOptions={groupAOptions}
          groupBOptions={groupBOptions}
          groupBProgramForSessions={groupBProgramForSessions}
          groupBSessionLabel={groupBSessionLabel}
          selectedProgram={selectedProgram}
          selectedSessions={selectedSessions}
          textareaRef={textareaRef}
          keepDropdownOpenRef={keepDropdownOpenRef}
          onInputChange={(value, caretIndex) => {
            setInput(value);
            updateMentionState(value, caretIndex);
          }}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
          onSuggestionSelect={sendMessage}
          onMentionSelect={handleMentionSelect}
          onMentionOpenChange={setIsMentionOpen}
          onDropdownOpenChange={setDropdownOpen}
          onActiveSubmenuChange={setActiveSubmenu}
          onSessionToggle={handleSessionToggle}
          onProgramSelect={handleProgramSelect}
          formatGroupASessionTriggerLabel={formatGroupASessionTriggerLabel}
        />
      </div>
    </div>
  );
}

export const ENGAGEMENT_STORAGE_KEYS = {
  completed: "engagement-prompt-completed",
  actionCount: "engagement-prompt-action-count",
  threshold: "engagement-prompt-threshold",
  lastShownAt: "engagement-prompt-last-shown-at",
  ratingAttempts: "engagement-prompt-rating-attempts",
} as const;

/** Max star-rating submissions (engagement drawer/dialog) before stars are disabled. */
export const MAX_ENGAGEMENT_RATING_ATTEMPTS = 1;

/** Production apex only — preview (*.pages.dev) and localhost stay quiet. */
const PRODUCTION_SITE_HOST = "bilauitmcuti.com";

export type EngagementActionType =
  | "grid_cell_open"
  | "grid_drawer_nav"
  | "view_mode_change"
  | "filter_toggle"
  | "settings_open"
  | "session_change"
  | "program_change"
  | "chat_send"
  | "chat_mention_open";

/** Higher bar so the prompt does not interrupt early browsing. */
const MIN_THRESHOLD = 20;
const MAX_THRESHOLD = 40;

/** After the prompt is shown (or dismissed), wait before offering it again. */
const SHOW_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function randomThreshold(): number {
  return MIN_THRESHOLD + Math.floor(Math.random() * (MAX_THRESHOLD - MIN_THRESHOLD + 1));
}

function normalizeHost(host: string): string {
  return host.replace(/^www\./, "").split(":")[0].toLowerCase();
}

/** Rating/share prompt only on production custom domain. */
export function isEngagementPromptEnabled(host?: string | null): boolean {
  const resolved =
    host ??
    (typeof window !== "undefined" ? window.location.hostname : null);
  if (!resolved?.trim()) return false;
  return normalizeHost(resolved) === PRODUCTION_SITE_HOST;
}

export function isEngagementCompleted(): boolean {
  return safeGetItem(ENGAGEMENT_STORAGE_KEYS.completed) === "1";
}

function ensureThreshold(): number {
  const stored = safeGetItem(ENGAGEMENT_STORAGE_KEYS.threshold);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!Number.isNaN(parsed) && parsed >= MIN_THRESHOLD) return parsed;
  }
  const next = randomThreshold();
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.threshold, String(next));
  return next;
}

function getActionCount(): number {
  const stored = safeGetItem(ENGAGEMENT_STORAGE_KEYS.actionCount);
  const parsed = stored ? parseInt(stored, 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isWithinShowCooldown(): boolean {
  const stored = safeGetItem(ENGAGEMENT_STORAGE_KEYS.lastShownAt);
  if (!stored) return false;
  const ts = parseInt(stored, 10);
  if (Number.isNaN(ts) || ts <= 0) return false;
  return Date.now() - ts < SHOW_COOLDOWN_MS;
}

export interface RecordEngagementResult {
  shouldOpen: boolean;
  count: number;
  threshold: number;
}

export function recordEngagementAction(
  _type?: EngagementActionType
): RecordEngagementResult {
  if (!isEngagementPromptEnabled()) {
    return { shouldOpen: false, count: 0, threshold: MIN_THRESHOLD };
  }

  if (isEngagementCompleted()) {
    const threshold = ensureThreshold();
    return { shouldOpen: false, count: getActionCount(), threshold };
  }

  const threshold = ensureThreshold();
  const nextCount = getActionCount() + 1;
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.actionCount, String(nextCount));

  return {
    shouldOpen: nextCount >= threshold && !isWithinShowCooldown(),
    count: nextCount,
    threshold,
  };
}

export function markEngagementCompleted(): void {
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.completed, "1");
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.actionCount, "0");
  safeRemoveItem(ENGAGEMENT_STORAGE_KEYS.threshold);
}

export function resetEngagementCycle(): void {
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.actionCount, "0");
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.threshold, String(randomThreshold()));
}

export function markEngagementShown(): void {
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.lastShownAt, String(Date.now()));
}

export function getEngagementRatingAttempts(): number {
  const stored = safeGetItem(ENGAGEMENT_STORAGE_KEYS.ratingAttempts);
  const parsed = stored ? parseInt(stored, 10) : 0;
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function isEngagementRatingLimitReached(): boolean {
  return getEngagementRatingAttempts() >= MAX_ENGAGEMENT_RATING_ATTEMPTS;
}

/** Records one rating submission; returns the new attempt count. */
export function recordEngagementRatingAttempt(): number {
  const next = getEngagementRatingAttempts() + 1;
  safeSetItem(ENGAGEMENT_STORAGE_KEYS.ratingAttempts, String(next));
  return next;
}

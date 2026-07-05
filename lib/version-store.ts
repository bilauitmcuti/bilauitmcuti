export const BUILD_ACK_KEY = "app-build-ack";

/** Production only; longer interval to cut noise and server load. */
export const POLL_INTERVAL_MS = 60_000;

export interface VersionSnapshot {
  isVisible: boolean;
  countdown: number;
}

const EMPTY_SNAPSHOT: VersionSnapshot = {
  isVisible: false,
  countdown: 5,
};

let snapshot: VersionSnapshot = { ...EMPTY_SNAPSHOT };

let documentLoadedBuildId: string | null = null;
let pendingBuildId: string | null = null;
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let countdownTimeoutId: ReturnType<typeof setTimeout> | null = null;
let pollingStarted = false;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersionSnapshot(): VersionSnapshot {
  return snapshot;
}

declare global {
  interface Window {
    /** Set synchronously in root layout before React hydrates. */
    __APP_BUILD_ID__?: string;
  }
}

/**
 * Resolve the build ID for the JS bundle actually running in this tab.
 * Prefer the client bundle over the SSR meta tag — meta can disagree on a
 * direct /chat full load (edge-cached HTML) while client nav reuses a frozen id.
 */
function readLoadedBuildIdFromPage(): string {
  if (typeof document === "undefined") return "";

  const fromClient = process.env.NEXT_PUBLIC_BUILD_ID?.trim() || "";
  if (fromClient) return fromClient;

  const fromBootstrap =
    typeof window !== "undefined" ? window.__APP_BUILD_ID__?.trim() || "" : "";
  if (fromBootstrap) return fromBootstrap;

  return (
    document.querySelector('meta[name="app-build-id"]')?.getAttribute("content")?.trim() ??
    ""
  );
}

/** Freeze the loaded build ID once per full page load (survives client navigations). */
export function getDocumentLoadedBuildId(): string {
  if (documentLoadedBuildId !== null) return documentLoadedBuildId;
  documentLoadedBuildId = readLoadedBuildIdFromPage();
  return documentLoadedBuildId;
}

export type VersionCheckResult = "skip" | "acknowledged" | "same" | "new";

export function evaluateVersionCheck(params: {
  loadedBuildId: string;
  serverBuildId: string;
  ackBuildId: string | null;
}): VersionCheckResult {
  const { loadedBuildId, serverBuildId, ackBuildId } = params;
  if (!loadedBuildId || !serverBuildId) return "skip";
  if (ackBuildId === serverBuildId) return "acknowledged";
  if (serverBuildId !== loadedBuildId) return "new";
  return "same";
}

function clearPoll(): void {
  if (pollIntervalId != null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

function stopCountdown(): void {
  if (countdownTimeoutId != null) {
    clearTimeout(countdownTimeoutId);
    countdownTimeoutId = null;
  }
}

function notifyNewBuild(buildId: string): void {
  if (pendingBuildId === buildId && snapshot.isVisible) return;
  pendingBuildId = buildId;
  snapshot = { isVisible: true, countdown: 5 };
  emit();
  clearPoll();
  startCountdown();
}

function reloadForNewBuild(): void {
  const buildId = pendingBuildId;
  if (buildId) {
    try {
      sessionStorage.setItem(BUILD_ACK_KEY, buildId);
    } catch {
      // storage unavailable, still reload
    }
  }
  window.location.reload();
}

function startCountdown(): void {
  stopCountdown();
  if (!snapshot.isVisible) return;

  if (snapshot.countdown <= 0) {
    reloadForNewBuild();
    return;
  }

  countdownTimeoutId = setTimeout(() => {
    snapshot = { ...snapshot, countdown: snapshot.countdown - 1 };
    emit();
    startCountdown();
  }, 1000);
}

async function checkVersion(): Promise<void> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return;
    const { buildId: serverBuildId } = (await res.json()) as { buildId?: string };
    if (!serverBuildId) return;

    const loadedBuildId = getDocumentLoadedBuildId();
    let ackBuildId: string | null = null;
    try {
      ackBuildId = sessionStorage.getItem(BUILD_ACK_KEY);
    } catch {
      // storage unavailable
    }

    if (evaluateVersionCheck({ loadedBuildId, serverBuildId, ackBuildId }) === "new") {
      notifyNewBuild(serverBuildId);
    }
  } catch {
    // network error, skip
  }
}

function startPoll(): void {
  clearPoll();
  if (typeof document === "undefined" || document.visibilityState !== "visible") return;
  pollIntervalId = setInterval(() => {
    void checkVersion();
  }, POLL_INTERVAL_MS);
}

function onVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    void checkVersion();
    startPoll();
  } else {
    clearPoll();
  }
}

/** Idempotent — safe to call from every VersionProvider mount. */
export function startVersionPolling(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof document === "undefined") return;

  if (!pollingStarted) {
    pollingStarted = true;
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  if (document.visibilityState === "visible") {
    void checkVersion();
    startPoll();
  }
}

/** Stop polling and hide any visible update banner (e.g. on `/chat`). */
export function stopVersionPolling(): void {
  clearPoll();
  stopCountdown();
  if (pollingStarted && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  pollingStarted = false;
  pendingBuildId = null;
  if (snapshot.isVisible) {
    snapshot = { ...EMPTY_SNAPSHOT };
    emit();
  }
}

/** Test-only reset for isolated unit tests. */
export function resetVersionStoreForTests(): void {
  snapshot = { ...EMPTY_SNAPSHOT };
  documentLoadedBuildId = null;
  pendingBuildId = null;
  clearPoll();
  stopCountdown();
  if (pollingStarted && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  pollingStarted = false;
  listeners.clear();
}

/** Test-only hook to simulate a detected build without fetch. */
export function notifyNewBuildForTests(buildId: string): void {
  notifyNewBuild(buildId);
}

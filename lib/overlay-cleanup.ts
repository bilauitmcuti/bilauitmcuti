export const CALENDAR_URL_CHANGE_EVENT = "calendar-url-change";

export interface CalendarUrlChangeDetail {
  path: string;
}

/** Notify listeners after client-side replaceState calendar navigation. */
export function dispatchCalendarUrlChange(path: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CalendarUrlChangeDetail>(CALENDAR_URL_CHANGE_EVENT, {
      detail: { path },
    })
  );
}

function hideOverlayNode(node: Element): void {
  if (!(node instanceof HTMLElement)) return;
  node.style.pointerEvents = "none";
  node.style.visibility = "hidden";
}

function removeNode(node: Element): void {
  node.remove();
}

/**
 * Soft-dismiss full-screen blockers before route changes.
 * Does not remove React-managed menu/popover portals (avoids global error crashes).
 */
export function dismissBlockingOverlays(): void {
  if (typeof document === "undefined") return;

  const selectors = [
    '[data-slot="drawer-viewport"]',
    '[data-slot="drawer-overlay"]',
    '[data-slot="dialog-overlay"]',
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(hideOverlayNode);
  }

  document.body.style.pointerEvents = "";
  document.documentElement.style.pointerEvents = "";
}

/**
 * Hard-remove orphaned overlay layers for error-boundary recovery only.
 */
export function purgeStaleOverlayPortals(): void {
  if (typeof document === "undefined") return;

  const selectors = [
    '[data-slot="drawer-viewport"]',
    '[data-slot="drawer-overlay"]',
    '[data-slot="drawer-portal"]',
    '[data-slot="dialog-overlay"]',
    '[data-slot="dialog-portal"]',
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(removeNode);
  }

  document.body.style.pointerEvents = "";
  document.documentElement.style.pointerEvents = "";
}

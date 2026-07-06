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

function removeNode(node: Element): void {
  node.remove();
}

/**
 * Clear Base UI modal menu / drawer interaction locks left after abrupt unmount.
 * Modal menus set `inert` on siblings; if the menu unmounts during navigation the page stays dead.
 */
export function releaseModalInteractionLocks(): void {
  if (typeof document === "undefined") return;

  document.querySelectorAll("[inert]").forEach((node) => {
    node.removeAttribute("inert");
  });
  document.querySelectorAll("[data-base-ui-inert]").forEach((node) => {
    node.removeAttribute("data-base-ui-inert");
  });

  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.overflow = "";
}

/**
 * Soft cleanup before route changes. Never removes React-managed portal nodes.
 */
export function dismissBlockingOverlays(): void {
  releaseModalInteractionLocks();
}

/**
 * Hard-remove orphaned overlay layers for error-boundary recovery only.
 */
export function purgeStaleOverlayPortals(): void {
  if (typeof document === "undefined") return;

  releaseModalInteractionLocks();

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
}

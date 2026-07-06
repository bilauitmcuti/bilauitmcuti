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
 * Remove orphaned Base UI portal layers that can block clicks after route changes
 * or error-boundary recovery (drawer viewport/backdrop, dialog overlay, etc.).
 */
export function purgeStaleOverlayPortals(): void {
  if (typeof document === "undefined") return;

  const selectors = [
    '[data-slot="drawer-viewport"]',
    '[data-slot="drawer-overlay"]',
    '[data-slot="drawer-portal"]',
    '[data-slot="dialog-overlay"]',
    '[data-slot="dialog-portal"]',
    '[data-slot="dropdown-menu-portal"]',
    '[data-slot="popover-content"]',
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(removeNode);
  }

  document.body.style.pointerEvents = "";
  document.documentElement.style.pointerEvents = "";
}

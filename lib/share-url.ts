import { hasSessionQueryParams } from "@/lib/session-query";

const SITE_ORIGIN = "https://bilauitmcuti.com";

function getPathnameOnly(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function getSiteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return SITE_ORIGIN;
}

function buildAbsoluteFromPathname(pathname: string): string {
  const origin = getSiteOrigin();
  if (pathname === "/") return origin;
  return `${origin}${pathname}`;
}

/** Path-only URL for sharing and canonical (no session query). */
export function getPageShareUrl(): string {
  if (typeof window === "undefined") return SITE_ORIGIN;
  return buildAbsoluteFromPathname(getPathnameOnly());
}

/**
 * og:url for client sync: matches the address bar when it has session query keys;
 * otherwise path-only (same as share URL).
 */
export function getPageOpenGraphUrl(): string {
  if (typeof window === "undefined") return SITE_ORIGIN;
  const pathname = getPathnameOnly();
  const base = buildAbsoluteFromPathname(pathname);
  const search = window.location.search;
  if (!search) return base;
  const params = new URLSearchParams(search);
  if (!hasSessionQueryParams(params)) return base;
  return `${base}${search}`;
}

/** Canonical and share stay clean; og:url includes session query only when present in the URL. */
export function syncPageShareUrl(): void {
  if (typeof document === "undefined") return;

  const canonicalUrl = getPageShareUrl();
  const ogUrl = getPageOpenGraphUrl();

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", canonicalUrl);

  let ogUrlMeta = document.querySelector('meta[property="og:url"]');
  if (!ogUrlMeta) {
    ogUrlMeta = document.createElement("meta");
    ogUrlMeta.setAttribute("property", "og:url");
    document.head.appendChild(ogUrlMeta);
  }
  ogUrlMeta.setAttribute("content", ogUrl);
}

/** Replace address bar with a clean path (no session query). */
export function replaceCalendarHistoryUrl(path: string): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", path);
  syncPageShareUrl();
}

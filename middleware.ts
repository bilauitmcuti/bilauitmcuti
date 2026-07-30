import { NextRequest, NextResponse } from "next/server";
import {
  CALENDAR_FILTERS_COOKIE,
  CALENDAR_FILTERS_MAX_AGE,
  parseFiltersFromCookie,
} from "@/lib/cookie-utils";
import {
  applyFilterKeysToFilters,
  hasFilterQueryParams,
  parseFilterKeysFromSearchParams,
} from "@/lib/filter-query";
import {
  applySessionIdsToFilters,
  hasSessionQueryParams,
  isCalendarPath,
  parseSessionIdsFromSearchParams,
  resolveCleanCalendarPath,
  resolveProgramForSessionQuery,
  resolveProgramFromCalendarPath,
} from "@/lib/session-query";
import { isSocialPreviewCrawler } from "@/lib/social-preview-crawler";
import { applySecurityHeaders } from "@/lib/security-headers";

function handleCalendarQueryRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (!isCalendarPath(pathname)) return null;

  const searchParams = request.nextUrl.searchParams;
  const hasSessions = hasSessionQueryParams(searchParams);
  const hasFilters = hasFilterQueryParams(searchParams);
  if (!hasSessions && !hasFilters) return null;

  const existingCookie = request.cookies.get(CALENDAR_FILTERS_COOKIE)?.value;
  const existing = parseFiltersFromCookie(existingCookie);

  let merged = existing;
  let program = resolveProgramFromCalendarPath(pathname);

  if (hasSessions) {
    const sessionIds = parseSessionIdsFromSearchParams(searchParams);
    program = resolveProgramForSessionQuery(
      pathname,
      sessionIds,
      existing.selectedProgram
    );
    merged = applySessionIdsToFilters(merged, sessionIds, program);
  }

  if (hasFilters) {
    const filterKeys = parseFilterKeysFromSearchParams(searchParams);
    merged = applyFilterKeysToFilters(merged, filterKeys);
  }

  const ua = request.headers.get("user-agent") ?? "";
  // Keep session + filter query for OG crawlers (same as session-only previews).
  const preserveQueryForPreview =
    (hasSessions || hasFilters) && isSocialPreviewCrawler(ua);

  const response = preserveQueryForPreview
    ? NextResponse.next()
    : NextResponse.redirect(
        new URL(resolveCleanCalendarPath(pathname, program), request.url)
      );

  response.cookies.set(CALENDAR_FILTERS_COOKIE, JSON.stringify(merged), {
    path: "/",
    maxAge: CALENDAR_FILTERS_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return applySecurityHeaders(response);
}

export function middleware(request: NextRequest) {
  const calendarRedirect = handleCalendarQueryRedirect(request);
  if (calendarRedirect) return calendarRedirect;
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|png|jpg|jpeg|gif|webp|ico|svg|woff2?)$).*)",
  ],
};

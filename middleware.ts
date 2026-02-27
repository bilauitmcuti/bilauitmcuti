import { NextRequest, NextResponse } from "next/server";

/**
 * Bot patterns to block from accessing chat routes.
 * Blocks search engine crawlers, AI crawlers, HTTP tools, and scrapers.
 */
const BOT_PATTERNS = [
  // Search engine crawlers
  "googlebot",
  "bingbot",
  "yandexbot",
  "baiduspider",
  "duckduckbot",
  // AI crawlers
  "gptbot",
  "chatgpt-user",
  "claudebot",
  "anthropic",
  "ccbot",
  "bytespider",
  // HTTP tools
  "curl",
  "wget",
  "httpie",
  "postman",
  "insomnia",
  // Scrapers / generic
  "scrapy",
  "python-requests",
  "axios",
  "node-fetch",
  "go-http-client",
  // Headless browsers
  "headlesschrome",
  "phantomjs",
];

function isBotUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((pattern) => lower.includes(pattern));
}

function hasBrowserHeaders(request: NextRequest): boolean {
  const acceptLanguage = request.headers.get("accept-language");
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchSite = request.headers.get("sec-fetch-site");
  // Real browsers typically send Accept-Language and Sec-Fetch-* headers
  return !!(acceptLanguage && (secFetchMode || secFetchSite));
}

function hasPageOrigin(request: NextRequest): boolean {
  const referer = request.headers.get("referer");
  const origin = request.headers.get("origin");
  const base = "cutiuitm.xyz";
  return !!(referer?.includes(base) || origin?.includes(base)); // matches apex and www
}

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  if (isBotUserAgent(ua)) return true;
  // Empty or missing UA with no browser headers is suspicious
  if (!ua.trim() && !hasBrowserHeaders(request)) return true;
  return false;
}

function isLikelyRealBrowser(request: NextRequest, pathname: string): boolean {
  if (pathname !== "/chat/api" && !pathname.startsWith("/chat/api/")) return false;
  // POST from our page (Referer/Origin) is strong signal for real chat client
  return request.method === "POST" && hasPageOrigin(request);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Allow /chat/api POST from our page (Referer/Origin) to reduce mobile false-positives
  if (isLikelyRealBrowser(request, pathname)) return NextResponse.next();
  if (isBot(request)) {
    if (pathname === "/chat/api" || pathname.startsWith("/chat/api/")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    // /chat page: redirect to homepage
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat", "/chat/:path*"],
};

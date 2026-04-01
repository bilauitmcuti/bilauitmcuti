import type {
  PublicHolidayMeta,
  PublicHolidayResponse,
} from "@/lib/public-holiday-types";

const DEFAULT_BASE = "https://api.bilauitmcuti.com";

function normalizeApiOrigin(raw: string): string {
  let value = raw.trim().replace(/\/$/, "");
  if (value.endsWith("/api")) value = value.slice(0, -4);
  return value;
}

function getApiBase(): string {
  const raw =
    process.env.CALENDAR_API_BASE?.trim() ||
    process.env.NEXT_PUBLIC_CALENDAR_API_BASE?.trim() ||
    DEFAULT_BASE;
  return normalizeApiOrigin(raw);
}

function buildUrl(path: string, params?: URLSearchParams): string {
  const qs = params?.toString() ? `?${params.toString()}` : "";
  return `${getApiBase()}/api/v1/public-holiday${path}${qs}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Public Holiday API ${res.status}: ${text.slice(0, 200) || res.statusText}`
    );
  }
  return (await res.json()) as T;
}

export async function fetchPublicHolidayMeta(): Promise<PublicHolidayMeta> {
  return fetchJson<PublicHolidayMeta>(buildUrl("/meta"));
}

export async function fetchPublicHolidayData(params: {
  year: number;
  scope?: "federal" | "state";
  state?: string;
}): Promise<PublicHolidayResponse> {
  const qs = new URLSearchParams();
  qs.set("year", String(params.year));
  if (params.scope) qs.set("scope", params.scope);
  if (params.state) qs.set("state", params.state);
  return fetchJson<PublicHolidayResponse>(buildUrl("", qs));
}

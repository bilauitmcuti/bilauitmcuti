export interface TurnstileSiteVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  challenge_ts?: string;
  cdata?: Record<string, unknown>;
}

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Apex hostname used for Turnstile hostname checks (www and apex both normalize here). */
const PRODUCTION_HOST_APEX = "bilauitmcuti.com";

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, "").split(":")[0].toLowerCase();
}

/**
 * When the request Host is production, enforce Turnstile hostname against apex
 * so both `bilauitmcuti.com` and `www.bilauitmcuti.com` match siteverify `hostname`.
 */
export function getTurnstileExpectedHostname(hostHeader: string | null): string | undefined {
  const n = normalizeHostname(hostHeader ?? "");
  if (n === PRODUCTION_HOST_APEX) return PRODUCTION_HOST_APEX;
  return undefined;
}

/** Optional remoteip for siteverify (recommended when available). */
export function getClientIpForTurnstile(request: { headers: Headers }): string | undefined {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  if (!ip || ip === "unknown") return undefined;
  return ip;
}

export async function verifyTurnstileToken(params: {
  token: string;
  expectedAction?: string;
  expectedHostname?: string;
  secretKey?: string;
  remoteip?: string;
}): Promise<TurnstileSiteVerifyResponse> {
  const secretKey = params.secretKey ?? process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing TURNSTILE_SECRET_KEY env var");

  const form = new URLSearchParams({
    secret: secretKey,
    response: params.token,
  });

  if (params.remoteip) form.append("remoteip", params.remoteip);

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = (await res.json()) as TurnstileSiteVerifyResponse;
  if (!data.success) return data;

  if (params.expectedAction && data.action && data.action !== params.expectedAction) {
    return { ...data, success: false, "error-codes": ["invalid-action"] };
  }

  if (params.expectedHostname && data.hostname) {
    const want = normalizeHostname(params.expectedHostname);
    const got = normalizeHostname(data.hostname);
    if (got !== want) {
      return { ...data, success: false, "error-codes": ["invalid-hostname"] };
    }
  }

  return data;
}

export async function checkEnv(): Promise<{ ok: boolean; ai: "configured" | "missing" }> {
  try {
    const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getOptionalRequestContext();
    const ai = (ctx?.env as CloudflareEnv | undefined)?.AI;
    if (ai) return { ok: true, ai: "configured" };
  } catch {
    // No Cloudflare context (next dev without platform, etc.)
  }
  return { ok: false, ai: "missing" };
}

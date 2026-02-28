import { z } from "zod";

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required for chat feature"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;
  const result = envSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
  if (!result.success) {
    const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Env validation failed: ${msg}`);
  }
  _env = result.data;
  return _env;
}

export function checkEnv(): { ok: boolean; groq: "configured" | "missing" } {
  const hasGroq = !!process.env.GROQ_API_KEY?.trim();
  return { ok: hasGroq, groq: hasGroq ? "configured" : "missing" };
}

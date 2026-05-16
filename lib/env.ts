export interface Env {
  GROQ_API_KEY: string;
  NODE_ENV?: string;
}

export interface TelegramEnv {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("Env validation failed: GROQ_API_KEY is required for chat feature");
  _env = { GROQ_API_KEY: key, NODE_ENV: process.env.NODE_ENV };
  return _env;
}

export function checkEnv(): { ok: boolean; groq: "configured" | "missing" } {
  const hasGroq = !!process.env.GROQ_API_KEY?.trim();
  return { ok: hasGroq, groq: hasGroq ? "configured" : "missing" };
}

let _telegramEnv: TelegramEnv | null = null;

export function getTelegramEnv(): TelegramEnv {
  if (_telegramEnv) return _telegramEnv;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token) throw new Error("Telegram env validation failed: TELEGRAM_BOT_TOKEN is required");
  if (!chatId) throw new Error("Telegram env validation failed: TELEGRAM_CHAT_ID is required");
  _telegramEnv = { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId };
  return _telegramEnv;
}

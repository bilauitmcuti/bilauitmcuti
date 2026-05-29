const CHAT_GREETINGS = [
  "What can I help you with?",
  "How can I help you today?",
  "What's on your mind?",
  "Ready when you are.",
  "Ask me anything about UiTM calendars.",
  "Got a question about cuti or kuliah?",
  "Where should we begin?",
  "Apa yang boleh saya bantu?",
  "Ada soalan tentang kalendar akademik?",
  "Tanya apa sahaja tentang tarikh UiTM.",
  "Nak tahu bila cuti atau kuliah?",
  "Sedia membantu — apa soalan anda?",
  "Bila cuti? Bila kuliah? Tanya je.",
  "Need dates for registration, exams, or breaks?",
  "Let's find your next UiTM date.",
] as const;

export const CHAT_GREETING_FALLBACK = CHAT_GREETINGS[0];

export function pickRandomChatGreeting(): string {
  const index = Math.floor(Math.random() * CHAT_GREETINGS.length);
  return CHAT_GREETINGS[index] ?? CHAT_GREETING_FALLBACK;
}

export function getChatGreetingPoolSize(): number {
  return CHAT_GREETINGS.length;
}

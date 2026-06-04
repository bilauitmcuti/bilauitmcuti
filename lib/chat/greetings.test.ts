import { describe, expect, it } from "vitest";
import {
  CHAT_GREETING_FALLBACK,
  getChatGreetingPoolSize,
  pickRandomChatGreeting,
} from "@/lib/chat/greetings";

describe("chat greetings", () => {
  it("has a non-empty greeting pool", () => {
    expect(getChatGreetingPoolSize()).toBeGreaterThanOrEqual(10);
  });

  it("returns a greeting from the pool", () => {
    expect(pickRandomChatGreeting()).toBeTruthy();
  });

  it("uses a stable fallback", () => {
    expect(CHAT_GREETING_FALLBACK).toBe("What can I help you with?");
  });
});

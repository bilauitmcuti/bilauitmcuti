import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AI_MODELS,
  MODEL_WORKERS_AI_LEGACY_GEMMA,
  resolveProductionChatModelChain,
  resolveWorkersAiModelTier,
  shouldStreamTokensToClient,
} from "@/lib/ai";

describe("resolveProductionChatModelChain", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses GLM with Scout fallback on dev host", () => {
    expect(resolveProductionChatModelChain("localhost:3000")).toEqual([
      AI_MODELS.chat,
      AI_MODELS.fallback,
    ]);
  });

  it("uses GLM with Scout fallback on production host", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveProductionChatModelChain("bilauitmcuti.com")).toEqual([
      AI_MODELS.chat,
      AI_MODELS.fallback,
    ]);
  });

  it("marks production tier by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveWorkersAiModelTier("bilauitmcuti.com")).toBe("production");
    expect(resolveWorkersAiModelTier("localhost:3000")).toBe("production");
  });

  it("uses dev tier when WORKERS_AI_USE_DEV_MODEL=1", () => {
    vi.stubEnv("WORKERS_AI_USE_DEV_MODEL", "1");
    expect(resolveWorkersAiModelTier("localhost:3000")).toBe("dev");
  });

  it("respects AI_CHAT_MODEL override with fallback", () => {
    vi.stubEnv("AI_CHAT_MODEL", MODEL_WORKERS_AI_LEGACY_GEMMA);
    expect(resolveProductionChatModelChain("localhost:3000")).toEqual([
      MODEL_WORKERS_AI_LEGACY_GEMMA,
      AI_MODELS.fallback,
    ]);
  });

  it("respects WORKERS_AI_MODEL alias", () => {
    vi.stubEnv("WORKERS_AI_MODEL", MODEL_WORKERS_AI_LEGACY_GEMMA);
    expect(resolveProductionChatModelChain("bilauitmcuti.com")[0]).toBe(
      MODEL_WORKERS_AI_LEGACY_GEMMA
    );
  });

  it("dedupes when override matches fallback", () => {
    vi.stubEnv("AI_CHAT_MODEL", AI_MODELS.chat);
    vi.stubEnv("AI_FALLBACK_MODEL", AI_MODELS.chat);
    expect(resolveProductionChatModelChain("localhost:3000")).toEqual([
      AI_MODELS.chat,
    ]);
  });

  it("streams tokens to the chat client (progressive paint, done replaces full reply)", () => {
    expect(shouldStreamTokensToClient("bilauitmcuti.com")).toBe(true);
    expect(shouldStreamTokensToClient("localhost:3000")).toBe(true);
  });
});

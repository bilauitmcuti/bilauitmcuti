import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  agentModeForModelChain,
  agentModeForModelId,
  isChatAgentEnabled,
} from "@/lib/chat/agent/run-agent";
import {
  AI_MODELS,
  MODEL_WORKERS_AI_DEV,
  MODEL_WORKERS_AI_LEGACY_LLAMA,
  MODEL_WORKERS_AI_PRODUCTION,
  supportsFunctionCalling,
} from "@/lib/ai";

describe("isChatAgentEnabled", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true by default", () => {
    expect(isChatAgentEnabled()).toBe(true);
  });

  it("is false when CHAT_USE_AGENT=0", () => {
    vi.stubEnv("CHAT_USE_AGENT", "0");
    expect(isChatAgentEnabled()).toBe(false);
  });

  it("is true when CHAT_USE_AGENT=1", () => {
    vi.stubEnv("CHAT_USE_AGENT", "1");
    expect(isChatAgentEnabled()).toBe(true);
  });
});

describe("supportsFunctionCalling", () => {
  it("enables GLM and partner models", () => {
    expect(supportsFunctionCalling(MODEL_WORKERS_AI_PRODUCTION)).toBe(true);
    expect(supportsFunctionCalling(AI_MODELS.chat)).toBe(true);
    expect(supportsFunctionCalling("google/gemini-3.1-flash-lite")).toBe(true);
  });

  it("disables legacy Llama model", () => {
    expect(supportsFunctionCalling(MODEL_WORKERS_AI_LEGACY_LLAMA)).toBe(false);
  });
});

describe("agentModeForModelId", () => {
  it("uses tools for GLM", () => {
    expect(agentModeForModelId(MODEL_WORKERS_AI_PRODUCTION)).toBe("tools");
    expect(agentModeForModelId(MODEL_WORKERS_AI_DEV)).toBe("tools");
  });

  it("uses compact fallback for legacy Llama", () => {
    expect(agentModeForModelId(MODEL_WORKERS_AI_LEGACY_LLAMA)).toBe("compact");
  });
});

describe("agentModeForModelChain", () => {
  it("uses tools when chain includes a function-calling model", () => {
    expect(agentModeForModelChain([MODEL_WORKERS_AI_PRODUCTION])).toBe("tools");
    expect(agentModeForModelChain([AI_MODELS.chat, AI_MODELS.fallback])).toBe("tools");
  });

  it("uses compact fallback for legacy Llama-only chain", () => {
    expect(agentModeForModelChain([MODEL_WORKERS_AI_LEGACY_LLAMA])).toBe("compact");
  });
});

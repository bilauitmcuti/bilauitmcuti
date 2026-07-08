import { describe, expect, it } from "vitest";
import { resolveChatExecutionMode } from "@/lib/chat/handler";
import { MAX_AGENT_TOOL_STEPS } from "@/lib/chat/agent/types";

describe("resolveChatExecutionMode", () => {
  it("uses single_stream when agent tools path is disabled (dev Llama)", () => {
    expect(resolveChatExecutionMode({ isAgentToolsPath: false })).toBe("single_stream");
  });

  it("always uses agent on Gemma tools path, including matched activity turns", () => {
    expect(resolveChatExecutionMode({ isAgentToolsPath: true })).toBe("agent");
  });

  it("is deterministic — same inputs always yield the same mode", () => {
    const input = { isAgentToolsPath: true };
    expect(resolveChatExecutionMode(input)).toBe(resolveChatExecutionMode(input));
    expect(resolveChatExecutionMode(input)).toBe("agent");
  });
});

describe("MAX_AGENT_TOOL_STEPS", () => {
  it("allows up to 5 tool steps on production Gemma (4b1723a parity)", () => {
    expect(MAX_AGENT_TOOL_STEPS).toBe(5);
  });
});

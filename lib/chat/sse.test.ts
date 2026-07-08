import { describe, expect, it } from "vitest";
import {
  consumeChatStream,
  encodeSseEvent,
  parseSseBuffer,
} from "@/lib/chat/sse";

describe("sse helpers", () => {
  it("encodes event lines", () => {
    const line = encodeSseEvent("token", { token: "Hi" });
    expect(line).toContain("event: token");
    expect(line).toContain('"token":"Hi"');
  });

  it("parses buffered events", () => {
    const events: Array<{ event: string; data: unknown }> = [];
    const remainder = parseSseBuffer(
      'event: done\ndata: {"reply":"ok","correlationId":"c1"}\n\n',
      (event, data) => events.push({ event, data })
    );
    expect(remainder).toBe("");
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("done");
  });
});

function streamResponse(chunks: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

describe("consumeChatStream", () => {
  it("emits tokens, status, and done for a complete stream", async () => {
    const res = streamResponse([
      encodeSseEvent("status", { phase: "generating", message: "Writing…" }),
      encodeSseEvent("token", { token: "Hello" }),
      encodeSseEvent("done", { reply: "Hello", correlationId: "c1" }),
    ]);
    const tokens: string[] = [];
    const statuses: string[] = [];
    let done: { reply: string; correlationId: string } | undefined;
    let errored = false;

    await consumeChatStream(res, {
      onToken: (t) => tokens.push(t),
      onDone: (p) => {
        done = p;
      },
      onError: () => {
        errored = true;
      },
      onStatus: (p) => statuses.push(p.message ?? ""),
    });

    expect(tokens).toEqual(["Hello"]);
    expect(statuses).toEqual(["Writing…"]);
    expect(done).toEqual({ reply: "Hello", correlationId: "c1" });
    expect(errored).toBe(false);
  });

  it("reports a 502 error when the stream closes without done/error", async () => {
    const res = streamResponse([encodeSseEvent("token", { token: "partial" })]);
    let error: { error: string; status?: number } | undefined;
    await consumeChatStream(res, {
      onToken: () => {},
      onDone: () => {},
      onError: (p) => {
        error = p;
      },
    });
    expect(error?.status).toBe(502);
    expect(error?.error).toContain("Connection closed");
  });

  it("emits a 504 error when the abort signal fires mid-stream", async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        const encoder = new TextEncoder();
        ctrl.enqueue(encoder.encode(encodeSseEvent("token", { token: "x" })));
        // Never close — simulate a stalled stream and abort from outside.
        controller.signal.addEventListener("abort", () => {
          try {
            ctrl.close();
          } catch {
            /* ignore */
          }
        });
      },
    });
    const res = new Response(stream, {
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
    let error: { error: string; status?: number } | undefined;
    const pending = consumeChatStream(
      res,
      {
        onToken: () => {},
        onDone: () => {},
        onError: (p) => {
          error = p;
        },
      },
      { signal: controller.signal }
    );
    controller.abort();
    await pending;
    expect(error?.status).toBe(504);
  });
});

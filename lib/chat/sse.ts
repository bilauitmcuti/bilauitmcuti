export const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export function encodeSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function sseResponse(
  stream: ReadableStream<Uint8Array>,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(stream, {
    headers: { ...SSE_HEADERS, ...extraHeaders },
  });
}

export interface ChatStreamDonePayload {
  reply: string;
  correlationId: string;
}

export interface ChatStreamErrorPayload {
  error: string;
  status?: number;
}

export interface ChatStreamTokenPayload {
  token: string;
}

export interface ChatStreamStatusPayload {
  /** Server-side phase hint: "searching" | "generating" | etc. */
  phase?: string;
  message?: string;
}

/** Parse SSE lines from a chunk buffer (handles partial lines across reads). */
export function parseSseBuffer(
  buffer: string,
  onEvent: (event: string, data: unknown) => void
): string {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  for (const block of parts) {
    const lines = block.split("\n");
    let event = "message";
    let dataLine = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
    }
    if (dataLine) {
      try {
        onEvent(event, JSON.parse(dataLine));
      } catch {
        onEvent(event, dataLine);
      }
    }
  }
  return remainder;
}

export interface ChatStreamHandlers {
  onToken: (token: string) => void;
  onDone: (payload: ChatStreamDonePayload) => void | Promise<void>;
  onError: (payload: ChatStreamErrorPayload) => void;
  onStatus?: (payload: ChatStreamStatusPayload) => void;
}

export async function consumeChatStream(
  response: Response,
  handlers: ChatStreamHandlers,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const text = await response.text();
    try {
      const data = JSON.parse(text) as {
        reply?: string;
        error?: string;
        correlationId?: string;
      };
      if (!response.ok) {
        handlers.onError({ error: data.error ?? "Request failed", status: response.status });
        return;
      }
      if (data.reply != null) {
        handlers.onDone({
          reply: data.reply,
          correlationId: data.correlationId ?? "",
        });
      }
    } catch {
      handlers.onError({ error: "Invalid response from server", status: response.status });
    }
    return;
  }

  if (!response.body) {
    handlers.onError({ error: "Empty stream", status: response.status });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePromise: Promise<void> | undefined;
  let receivedDone = false;
  let receivedError = false;

  const handleEvent = (event: string, data: unknown) => {
    if (event === "token") {
      const payload = data as ChatStreamTokenPayload;
      if (payload.token) handlers.onToken(payload.token);
    } else if (event === "done") {
      receivedDone = true;
      donePromise = Promise.resolve(
        handlers.onDone(data as ChatStreamDonePayload)
      );
    } else if (event === "error") {
      receivedError = true;
      handlers.onError(data as ChatStreamErrorPayload);
    } else if (event === "status") {
      handlers.onStatus?.(data as ChatStreamStatusPayload);
    }
  };

  const signal = options?.signal;
  const onAbort = () => {
    try {
      reader.cancel().catch(() => undefined);
    } catch {
      /* ignore */
    }
  };
  if (signal) {
    if (signal.aborted) {
      onAbort();
      handlers.onError({ error: "Request took too long. Please try again.", status: 504 });
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = parseSseBuffer(buffer, handleEvent);
      }
    } catch {
      /* read rejected (e.g. abort) — fall through to terminal-state check */
    }

    if (buffer.trim()) {
      parseSseBuffer(`${buffer}\n\n`, handleEvent);
    }

    if (donePromise) await donePromise;

    if (!receivedDone && !receivedError) {
      if (signal?.aborted) {
        handlers.onError({ error: "Request took too long. Please try again.", status: 504 });
      } else {
        handlers.onError({
          error: "Connection closed before response completed. Please try again.",
          status: 502,
        });
      }
    }
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

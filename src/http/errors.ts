import axios from "axios";

/**
 * A structured error that preserves the ClickUp HTTP status and response body.
 *
 * The previous implementation re-threw `new Error("Failed to ...")`, discarding
 * the status code and the API's own error message. Callers (and ultimately the
 * LLM) then saw identical, actionless failures. This type keeps the details so
 * the dispatcher can surface them.
 */
export class ClickUpApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly endpoint: string,
    public readonly status: number | undefined,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ClickUpApiError";
  }

  /** A compact, model-friendly representation for tool error output. */
  toDetails() {
    return {
      method: this.method,
      endpoint: this.endpoint,
      status: this.status,
      clickupError: extractApiMessage(this.body),
      body: this.body,
    };
  }
}

function extractApiMessage(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.err === "string") return b.err;
    if (typeof b.error === "string") return b.error;
    if (typeof b.message === "string") return b.message;
    if (typeof b.ECODE === "string") return String(b.ECODE);
  }
  return undefined;
}

/** Normalize any thrown value from an axios call into a ClickUpApiError. */
export function normalizeError(
  error: unknown,
  method: string,
  endpoint: string,
): ClickUpApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    const apiMsg = extractApiMessage(body) ?? error.message;
    const statusPart = status !== undefined ? ` (HTTP ${status})` : "";
    return new ClickUpApiError(
      method,
      endpoint,
      status,
      body,
      `ClickUp ${method} ${endpoint} failed${statusPart}: ${apiMsg}`,
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return new ClickUpApiError(
    method,
    endpoint,
    undefined,
    undefined,
    `ClickUp ${method} ${endpoint} failed: ${message}`,
  );
}

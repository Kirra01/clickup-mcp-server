import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ClickUpApiError } from "../http/errors.js";

/** Successful tool result: pretty-printed JSON in a single text block. */
export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/** Error tool result with `isError: true` so the client treats it as a failure. */
export function fail(message: string, details?: unknown): CallToolResult {
  const text =
    details !== undefined
      ? `${message}\n\n${JSON.stringify(details, null, 2)}`
      : message;
  return {
    isError: true,
    content: [{ type: "text", text }],
  };
}

/** Map any thrown value into a structured error result. */
export function failFrom(error: unknown): CallToolResult {
  if (error instanceof ClickUpApiError) {
    return fail(error.message, error.toDetails());
  }
  const message = error instanceof Error ? error.message : String(error);
  return fail(message);
}

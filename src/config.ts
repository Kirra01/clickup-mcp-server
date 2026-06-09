import dotenv from "dotenv";

// `quiet: true` suppresses dotenv's startup banner. It prints to stdout, which
// for a stdio MCP server would corrupt the JSON-RPC stream.
dotenv.config({ quiet: true });

export interface AppConfig {
  /** ClickUp Personal API Token (required). */
  personalToken: string;
  /** Base URL for the ClickUp REST API (without version segment). */
  apiBaseUrl: string;
  /** Optional outbound CONNECT proxy for reaching api.clickup.com. */
  proxyUrl: string;
  /** Log verbosity: error | warn | info | debug. */
  logLevel: string;
  /** Default page size hint applied to paginated reads when omitted. */
  requestTimeoutMs: number;
}

function readConfig(): AppConfig {
  const personalToken = process.env.CLICKUP_PERSONAL_TOKEN;
  if (!personalToken) {
    throw new Error(
      "Missing required environment variable: CLICKUP_PERSONAL_TOKEN",
    );
  }

  const proxyUrl =
    process.env.CLICKUP_HTTPS_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    "";

  const timeout = Number(process.env.CLICKUP_TIMEOUT_MS);

  return {
    personalToken,
    // ClickUp endpoints are versioned per-path (e.g. /v2/task, /v3/docs), so the
    // base URL intentionally stops at /api.
    apiBaseUrl: process.env.CLICKUP_API_URL || "https://api.clickup.com/api",
    proxyUrl,
    logLevel: process.env.LOG_LEVEL || "info",
    requestTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 30000,
  };
}

export const config: AppConfig = readConfig();

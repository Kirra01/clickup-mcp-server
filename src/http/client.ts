import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { config } from "../config.js";
import { logger } from "../logger.js";

const MAX_RETRIES = 3;

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Compute backoff delay (ms) for a 429, honoring ClickUp rate-limit headers. */
function rateLimitDelay(error: AxiosError, attempt: number): number {
  const headers = error.response?.headers ?? {};
  const retryAfter = Number(headers["retry-after"]);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }
  const reset = Number(headers["x-ratelimit-reset"]);
  if (Number.isFinite(reset) && reset > 0) {
    // ClickUp returns an absolute epoch-seconds reset time.
    const deltaMs = reset * 1000 - Date.now();
    if (deltaMs > 0 && deltaMs < 60_000) return deltaMs + 250;
  }
  // Exponential fallback: 1s, 2s, 4s.
  return 2 ** attempt * 1000;
}

export function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.requestTimeoutMs,
    headers: { "Content-Type": "application/json" },
    // When a proxy is configured, force a CONNECT tunnel via httpsAgent and
    // disable axios' env-proxy handling (which would resolve DNS locally and
    // defeat the point of tunneling past DNS pollution).
    ...(config.proxyUrl
      ? {
          httpsAgent: new HttpsProxyAgent(config.proxyUrl),
          proxy: false as const,
        }
      : {}),
  });

  if (config.proxyUrl) {
    logger.info(`ClickUp requests routed through proxy: ${config.proxyUrl}`);
  }

  // ClickUp personal tokens go in the Authorization header verbatim (no Bearer).
  client.interceptors.request.use((cfg) => {
    cfg.headers.set("Authorization", config.personalToken);
    return cfg;
  });

  // Retry transient 429s with backoff; surface everything else to the caller.
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const cfg = error.config as RetryableConfig | undefined;
      if (error.response?.status === 429 && cfg) {
        cfg.__retryCount = (cfg.__retryCount ?? 0) + 1;
        if (cfg.__retryCount <= MAX_RETRIES) {
          const delay = rateLimitDelay(error, cfg.__retryCount);
          logger.warn(
            `Rate limited (429); retry ${cfg.__retryCount}/${MAX_RETRIES} in ${delay}ms`,
          );
          await sleep(delay);
          return client.request(cfg);
        }
        logger.warn("Rate limit retries exhausted");
      }
      return Promise.reject(error);
    },
  );

  return client;
}

import { config } from "./config.js";

const LEVELS: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  private threshold: number;

  constructor() {
    // Fall back to "info" when LOG_LEVEL is unset or invalid, instead of
    // silently disabling all logging (the old NaN comparison did the latter).
    this.threshold = LEVELS[config.logLevel] ?? LEVELS.info;
  }

  private write(level: keyof typeof LEVELS, message: string, args: unknown[]) {
    if (LEVELS[level] > this.threshold) return;
    // Everything goes to stderr: stdout is reserved for the MCP stdio protocol.
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
    console.error(line, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write("error", message, args);
  }
  warn(message: string, ...args: unknown[]): void {
    this.write("warn", message, args);
  }
  info(message: string, ...args: unknown[]): void {
    this.write("info", message, args);
  }
  debug(message: string, ...args: unknown[]): void {
    this.write("debug", message, args);
  }
}

export const logger = new Logger();

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ClickUpApi } from "../services/clickup.api.js";

/** Shared context handed to every tool handler. */
export interface ToolContext {
  api: ClickUpApi;
}

/** A single tool: its name, zod input schema, and handler. */
export interface ToolDef<I extends ZodTypeAny = ZodTypeAny> {
  name: string;
  title?: string;
  description: string;
  input: I;
  /** Hint for clients: true if the tool only reads state. */
  readOnly?: boolean;
  /** Hint for clients: true if the tool can delete/overwrite data. */
  destructive?: boolean;
  handler: (args: z.infer<I>, ctx: ToolContext) => Promise<unknown>;
}

/**
 * Type-checks a tool's `handler` args against its zod `input` at the call site,
 * then widens the result to the base `ToolDef` so tools of differing input
 * shapes can live in a single `ToolDef[]` (the `input: I` field is invariant,
 * so the specific types are not mutually assignable without widening here).
 */
export function defineTool<I extends ZodTypeAny>(def: ToolDef<I>): ToolDef {
  return def as unknown as ToolDef;
}

/** Convert a ToolDef into the MCP wire `Tool` description. */
export function toMcpTool(def: ToolDef): Tool {
  const schema = zodToJsonSchema(def.input, {
    target: "jsonSchema7",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  delete schema.$schema;

  return {
    name: def.name,
    description: def.description,
    inputSchema: schema as Tool["inputSchema"],
    annotations: {
      title: def.title ?? def.name,
      readOnlyHint: def.readOnly ?? false,
      destructiveHint: def.destructive ?? false,
    },
  };
}

/** Build an immutable name→ToolDef registry, rejecting duplicate names. */
export function buildRegistry(defs: ToolDef[]): Map<string, ToolDef> {
  const map = new Map<string, ToolDef>();
  for (const def of defs) {
    if (map.has(def.name)) {
      throw new Error(`Duplicate tool name registered: ${def.name}`);
    }
    map.set(def.name, def);
  }
  return map;
}

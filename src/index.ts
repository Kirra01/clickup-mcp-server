#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createHttpClient } from "./http/client.js";
import { ClickUpApi } from "./services/clickup.api.js";
import {
  buildRegistry,
  toMcpTool,
  ToolContext,
  ToolDef,
} from "./core/registry.js";
import { ok, fail, failFrom } from "./core/respond.js";
import { logger } from "./logger.js";
import { taskTools } from "./tools/tasks.js";
import { hierarchyTools } from "./tools/hierarchy.js";
import { viewTools } from "./tools/views.js";
import { docTools } from "./tools/docs.js";
import { fieldTools } from "./tools/fields.js";

const allTools: ToolDef[] = [
  ...taskTools,
  ...hierarchyTools,
  ...viewTools,
  ...docTools,
  ...fieldTools,
];

async function main() {
  logger.info("Starting ClickUp MCP Server...");

  const api = new ClickUpApi(createHttpClient());
  const ctx: ToolContext = { api };
  const registry = buildRegistry(allTools);

  const server = new Server(
    { name: "clickup-mcp-server", version: "2.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...registry.values()].map(toMcpTool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const def = registry.get(name);
    if (!def) {
      return fail(`Unknown tool: ${name}`);
    }

    const parsed = def.input.safeParse(rawArgs ?? {});
    if (!parsed.success) {
      return fail(
        `Invalid arguments for ${name}`,
        parsed.error.flatten(),
      );
    }

    try {
      const result = await def.handler(parsed.data, ctx);
      return ok(result);
    } catch (error) {
      logger.error(`Tool ${name} failed:`, error);
      return failFrom(error);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(
    `ClickUp MCP Server ready over stdio with ${registry.size} tools.`,
  );
}

main().catch((error) => {
  logger.error("Fatal: failed to start ClickUp MCP Server:", error);
  process.exit(1);
});

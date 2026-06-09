# ClickUp MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for ClickUp, letting AI assistants read and write ClickUp workspaces, tasks, docs and views over **stdio**.

> This is a fork, rewritten in v2.0 around a single tool registry with zod-validated inputs, a consolidated API layer, structured error propagation, automatic 429 backoff, and optional outbound proxy support.

## Quick start

Authentication uses a **ClickUp Personal API Token** (ClickUp → Settings → Apps → Generate).

```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": ["/absolute/path/to/clickup-mcp-server/dist/index.js"],
      "env": {
        "CLICKUP_PERSONAL_TOKEN": "pk_xxx"
      }
    }
  }
}
```

Then `npm install && npm run build`, and restart your MCP client.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLICKUP_PERSONAL_TOKEN` | ✅ | ClickUp Personal API Token. |
| `CLICKUP_HTTPS_PROXY` | | Outbound CONNECT proxy for `api.clickup.com`. Useful where DNS to ClickUp is polluted — the proxy resolves the hostname from a clean vantage point. Falls back to `HTTPS_PROXY` / `https_proxy`. |
| `CLICKUP_API_URL` | | Override API base URL. Defaults to `https://api.clickup.com/api`. |
| `CLICKUP_TIMEOUT_MS` | | Per-request timeout in ms. Defaults to `30000`. |
| `LOG_LEVEL` | | `error` \| `warn` \| `info` \| `debug`. Defaults to `info`. Logs go to **stderr** only. |

## Tools

47 tools, named `clickup_<verb>_<noun>` (`list_`/`get_` read, `create_`/`update_`/`delete_` write).

### Tasks
`clickup_get_task` · `clickup_list_tasks` · `clickup_search_tasks` · `clickup_create_task` · `clickup_update_task` · `clickup_delete_task`

- **`clickup_list_tasks`** is the direct way to read a List's tasks — no need to go through Views.
- **`clickup_search_tasks`** filters tasks across a whole workspace (by space/folder/list, status, assignee, tag, dates).
- **`clickup_update_task`** changes assignees via `add_assignees` / `remove_assignees` (ClickUp requires the add/rem form on update; a flat list is ignored).

### Task collaboration
`clickup_list_task_comments` · `clickup_create_task_comment` · `clickup_add_tag_to_task` · `clickup_remove_tag_from_task` · `clickup_create_task_attachment`

### Hierarchy
`clickup_list_workspaces` · `clickup_list_spaces` · `clickup_get_space` · `clickup_create_space` · `clickup_update_space` · `clickup_delete_space` · `clickup_list_folders` · `clickup_get_folder` · `clickup_create_folder` · `clickup_update_folder` · `clickup_delete_folder` · `clickup_list_lists` · `clickup_get_list` · `clickup_create_list` · `clickup_update_list` · `clickup_delete_list` · `clickup_create_board`

- **`clickup_list_lists`** takes either `folder_id` or `space_id` (the latter returns folderless lists living directly under a Space).

### Views
`clickup_list_views` · `clickup_get_view` · `clickup_get_view_tasks` · `clickup_create_view` · `clickup_update_view` · `clickup_delete_view`

### Docs
`clickup_search_docs` · `clickup_create_doc` · `clickup_list_doc_pages` · `clickup_create_doc_page` · `clickup_get_doc_page` · `clickup_update_doc_page` · `clickup_replace_in_doc_page`

- **`clickup_replace_in_doc_page`** does a surgical read-modify-write replacement of an exact text fragment (ClickUp's API only offers whole-page replace/append/prepend). Fails if the fragment is absent, or matches more than once without `replace_all`.

### Users, members, fields & tags
`clickup_get_authorized_user` · `clickup_list_members` · `clickup_list_space_tags` · `clickup_list_custom_fields` · `clickup_set_custom_field_value` · `clickup_remove_custom_field_value`

- **`clickup_get_authorized_user`** / **`clickup_list_members`** resolve the numeric user IDs needed for assignees.

## Errors

Tool failures return `isError: true` with a structured payload that preserves ClickUp's own response:

```json
{
  "method": "GET",
  "endpoint": "/v2/task/bad_id",
  "status": 401,
  "clickupError": "Team not authorized",
  "body": { "err": "Team not authorized", "ECODE": "OAUTH_027" }
}
```

`429` responses are retried automatically with backoff (honoring `Retry-After` / `X-RateLimit-Reset`).

## Architecture

```
src/
  index.ts              Thin entry: build client → collect tools → register & dispatch
  config.ts             Env config (token, proxy, api url, timeout, log level)
  logger.ts             Leveled logger (stderr only — stdout is the MCP channel)
  http/
    client.ts           Axios factory: proxy, auth, 429 backoff retry
    errors.ts           ClickUpApiError + normalizeError (keeps status & body)
  core/
    registry.ts         defineTool() + zod→JSON Schema + name→tool registry
    respond.ts          Unified ok()/fail() results
  services/
    clickup.api.ts      One typed wrapper over the whole ClickUp REST surface
  tools/                One ToolDef[] per domain (tasks, hierarchy, views, docs, fields)
```

Adding a tool = one `defineTool({ name, input: zodSchema, handler })` in the relevant `tools/*` file. The JSON Schema, runtime validation, `ListTools` entry and dispatch are all derived automatically.

## Development

```bash
npm install
npm run build      # tsc → dist/
npm test           # jest unit tests
npm run dev        # ts-node-dev on src/index.ts (stdio)
npm run type-check # tsc --noEmit
```

Create a `.env` with `CLICKUP_PERSONAL_TOKEN` (and optionally `CLICKUP_HTTPS_PROXY`) for local runs.

### MCP Inspector

```bash
CLICKUP_PERSONAL_TOKEN=pk_xxx npx @modelcontextprotocol/inspector node dist/index.js
```

## Security

- Treat `CLICKUP_PERSONAL_TOKEN` like a password; provide it via the client's env, never commit it.
- The token is sent in the `Authorization` header; nothing sensitive is logged at `info`.

## License

MIT — see [LICENSE](LICENSE).

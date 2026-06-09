import { z } from "zod";
import { defineTool, ToolDef } from "../core/registry.js";
import { compact } from "./common.js";

const parentType = z.enum(["team", "space", "folder", "list"]);

const listViews = defineTool({
  name: "clickup_list_views",
  title: "List views",
  readOnly: true,
  description:
    "List the Views on a parent (team, space, folder or list). Note: ClickUp's list-level endpoint only returns explicitly created views, not auto-generated defaults — to read a list's tasks prefer clickup_list_tasks.",
  input: z.object({ parent_type: parentType, parent_id: z.string() }),
  handler: ({ parent_type, parent_id }, { api }) =>
    api.listViews(parent_type, parent_id),
});

const getView = defineTool({
  name: "clickup_get_view",
  title: "Get view",
  readOnly: true,
  description: "Get a single View's configuration.",
  input: z.object({ view_id: z.string() }),
  handler: ({ view_id }, { api }) => api.getView(view_id),
});

const getViewTasks = defineTool({
  name: "clickup_get_view_tasks",
  title: "Get tasks in a view",
  readOnly: true,
  description:
    "Get tasks belonging to a View. Only task-bearing views (list/board/table) support this; dashboard-style 'Overview' views will error.",
  input: z.object({
    view_id: z.string(),
    page: z.number().int().min(0).optional(),
  }),
  handler: ({ view_id, page }, { api }) => api.getViewTasks(view_id, page),
});

const createView = defineTool({
  name: "clickup_create_view",
  title: "Create view",
  description: "Create a View on a team, space, folder or list.",
  input: z.object({
    parent_type: parentType,
    parent_id: z.string(),
    name: z.string(),
    type: z.enum(["list", "board", "calendar", "gantt", "table"]),
  }),
  handler: ({ parent_type, parent_id, ...body }, { api }) =>
    api.createView(parent_type, parent_id, compact(body)),
});

const updateView = defineTool({
  name: "clickup_update_view",
  title: "Update view",
  description:
    "Rename a View. Note: ClickUp's v2 PUT /view endpoint is known to sometimes return 500.",
  input: z.object({ view_id: z.string(), name: z.string() }),
  handler: ({ view_id, name }, { api }) => api.updateView(view_id, { name }),
});

const deleteView = defineTool({
  name: "clickup_delete_view",
  title: "Delete view",
  destructive: true,
  description: "Delete a View.",
  input: z.object({ view_id: z.string() }),
  handler: async ({ view_id }, { api }) => {
    await api.deleteView(view_id);
    return { success: true, deleted_view_id: view_id };
  },
});

export const viewTools: ToolDef[] = [
  listViews,
  getView,
  getViewTasks,
  createView,
  updateView,
  deleteView,
];

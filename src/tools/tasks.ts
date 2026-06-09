import { z } from "zod";
import { defineTool, ToolDef } from "../core/registry.js";
import { compact, priorityField, userId } from "./common.js";

const getTask = defineTool({
  name: "clickup_get_task",
  title: "Get task",
  readOnly: true,
  description:
    "Get a single task by ID, including status, assignees, custom fields and (optionally) subtasks.",
  input: z.object({
    task_id: z.string().describe("The task ID."),
    include_subtasks: z.boolean().optional(),
    include_markdown_description: z
      .boolean()
      .optional()
      .describe("Return the description as markdown."),
    custom_task_ids: z
      .boolean()
      .optional()
      .describe("Treat task_id as a custom ID (requires team_id)."),
    team_id: z.string().optional().describe("Required when custom_task_ids=true."),
  }),
  handler: ({ task_id, ...rest }, { api }) =>
    api.getTask(task_id, compact(rest)),
});

const listTasks = defineTool({
  name: "clickup_list_tasks",
  title: "List tasks in a list",
  readOnly: true,
  description:
    "Get tasks in a List. This is the direct, canonical way to read a list's tasks — no need to go through Views.",
  input: z.object({
    list_id: z.string().describe("The List ID."),
    archived: z.boolean().optional(),
    include_closed: z.boolean().optional(),
    subtasks: z.boolean().optional(),
    page: z.number().int().min(0).optional().describe("0-based page index."),
    order_by: z.enum(["id", "created", "updated", "due_date"]).optional(),
    reverse: z.boolean().optional(),
    statuses: z.array(z.string()).optional(),
    assignees: z.array(userId).optional(),
  }),
  handler: ({ list_id, ...rest }, { api }) =>
    api.listTasks(list_id, compact(rest)),
});

const searchTasks = defineTool({
  name: "clickup_search_tasks",
  title: "Search tasks across workspace",
  readOnly: true,
  description:
    "Get filtered tasks across an entire workspace (team), spanning multiple lists. Filter by space/project/list IDs, statuses, assignees, tags, dates.",
  input: z.object({
    team_id: z.string().describe("The Workspace (team) ID."),
    page: z.number().int().min(0).optional(),
    order_by: z.enum(["id", "created", "updated", "due_date"]).optional(),
    reverse: z.boolean().optional(),
    subtasks: z.boolean().optional(),
    include_closed: z.boolean().optional(),
    space_ids: z.array(z.string()).optional(),
    project_ids: z.array(z.string()).optional().describe("Folder IDs."),
    list_ids: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    assignees: z.array(userId).optional(),
    tags: z.array(z.string()).optional(),
    due_date_gt: z.number().int().optional(),
    due_date_lt: z.number().int().optional(),
  }),
  handler: ({ team_id, ...rest }, { api }) =>
    api.searchTasks(team_id, compact(rest)),
});

const createTask = defineTool({
  name: "clickup_create_task",
  title: "Create task",
  description: "Create a new task in a List.",
  input: z.object({
    list_id: z.string().describe("The List ID to create the task in."),
    name: z.string().describe("Task name."),
    description: z.string().optional().describe("Plain-text or markdown body."),
    markdown_content: z
      .string()
      .optional()
      .describe("Markdown body (takes precedence over description)."),
    assignees: z.array(userId).optional().describe("Assignee user IDs."),
    tags: z.array(z.string()).optional(),
    status: z.string().optional(),
    priority: priorityField,
    due_date: z.number().int().optional().describe("Unix ms."),
    due_date_time: z.boolean().optional(),
    start_date: z.number().int().optional().describe("Unix ms."),
    start_date_time: z.boolean().optional(),
    time_estimate: z.number().int().optional().describe("Milliseconds."),
    parent: z.string().optional().describe("Parent task ID (creates a subtask)."),
    notify_all: z.boolean().optional(),
  }),
  handler: ({ list_id, ...body }, { api }) =>
    api.createTask(list_id, compact(body)),
});

const updateTask = defineTool({
  name: "clickup_update_task",
  title: "Update task",
  description:
    "Update a task. To change assignees use add_assignees / remove_assignees (ClickUp requires the add/rem form on update — a flat list is silently ignored).",
  input: z.object({
    task_id: z.string().describe("The task ID."),
    name: z.string().optional(),
    description: z.string().optional(),
    markdown_content: z.string().optional(),
    status: z.string().optional(),
    priority: priorityField,
    due_date: z.number().int().optional().describe("Unix ms."),
    due_date_time: z.boolean().optional(),
    start_date: z.number().int().optional(),
    start_date_time: z.boolean().optional(),
    time_estimate: z.number().int().optional(),
    parent: z.string().optional(),
    archived: z.boolean().optional(),
    add_assignees: z.array(userId).optional().describe("User IDs to assign."),
    remove_assignees: z.array(userId).optional().describe("User IDs to unassign."),
  }),
  handler: ({ task_id, add_assignees, remove_assignees, ...rest }, { api }) => {
    const body: Record<string, unknown> = compact(rest);
    if (add_assignees || remove_assignees) {
      body.assignees = compact({
        add: add_assignees,
        rem: remove_assignees,
      });
    }
    return api.updateTask(task_id, body);
  },
});

const deleteTask = defineTool({
  name: "clickup_delete_task",
  title: "Delete task",
  destructive: true,
  description: "Permanently delete a task by ID.",
  input: z.object({ task_id: z.string().describe("The task ID.") }),
  handler: async ({ task_id }, { api }) => {
    await api.deleteTask(task_id);
    return { success: true, deleted_task_id: task_id };
  },
});

// ── Collaboration ───────────────────────────────────────────────────────

const listTaskComments = defineTool({
  name: "clickup_list_task_comments",
  title: "List task comments",
  readOnly: true,
  description: "Get the comments on a task.",
  input: z.object({ task_id: z.string() }),
  handler: ({ task_id }, { api }) => api.listTaskComments(task_id),
});

const createTaskComment = defineTool({
  name: "clickup_create_task_comment",
  title: "Comment on a task",
  description: "Add a comment to a task, optionally assigning it to a user.",
  input: z.object({
    task_id: z.string(),
    comment_text: z.string().describe("The comment body."),
    assignee: userId.optional().describe("User ID to assign the comment to."),
    notify_all: z.boolean().optional(),
  }),
  handler: ({ task_id, ...body }, { api }) =>
    api.createTaskComment(task_id, compact(body)),
});

const addTag = defineTool({
  name: "clickup_add_tag_to_task",
  title: "Add tag to task",
  description: "Attach an existing tag to a task.",
  input: z.object({
    task_id: z.string(),
    tag_name: z.string().describe("Name of an existing tag in the space."),
  }),
  handler: async ({ task_id, tag_name }, { api }) => {
    await api.addTagToTask(task_id, tag_name);
    return { success: true, task_id, tag_name };
  },
});

const removeTag = defineTool({
  name: "clickup_remove_tag_from_task",
  title: "Remove tag from task",
  destructive: true,
  description: "Remove a tag from a task.",
  input: z.object({ task_id: z.string(), tag_name: z.string() }),
  handler: async ({ task_id, tag_name }, { api }) => {
    await api.removeTagFromTask(task_id, tag_name);
    return { success: true, task_id, tag_name };
  },
});

const addAttachment = defineTool({
  name: "clickup_create_task_attachment",
  title: "Attach a file to a task",
  description:
    "Upload a local file as an attachment on a task. Provide an absolute path to a file readable by the server process.",
  input: z.object({
    task_id: z.string(),
    file_path: z.string().describe("Absolute path to the local file to upload."),
  }),
  handler: ({ task_id, file_path }, { api }) =>
    api.createTaskAttachment(task_id, file_path),
});

export const taskTools: ToolDef[] = [
  getTask,
  listTasks,
  searchTasks,
  createTask,
  updateTask,
  deleteTask,
  listTaskComments,
  createTaskComment,
  addTag,
  removeTag,
  addAttachment,
];

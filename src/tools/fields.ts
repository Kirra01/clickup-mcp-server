import { z } from "zod";
import { defineTool, ToolDef } from "../core/registry.js";
import { compact } from "./common.js";

// ── Authorized user & members ──────────────────────────────────────────────
const getAuthorizedUser = defineTool({
  name: "clickup_get_authorized_user",
  title: "Get current user",
  readOnly: true,
  description:
    "Get the user the API token belongs to (id, username, email). Useful for resolving the caller's own user ID.",
  input: z.object({}),
  handler: (_args, { api }) => api.getAuthorizedUser(),
});

const listMembers = defineTool({
  name: "clickup_list_members",
  title: "List list members",
  readOnly: true,
  description:
    "List the members who can access a List, with their numeric user IDs — use these IDs for assignees.",
  input: z.object({ list_id: z.string() }),
  handler: ({ list_id }, { api }) => api.listMembers(list_id),
});

// ── Tags ──────────────────────────────────────────────────────────────────
const listSpaceTags = defineTool({
  name: "clickup_list_space_tags",
  title: "List space tags",
  readOnly: true,
  description:
    "List the tags defined in a Space. These tag names are what clickup_add_tag_to_task expects.",
  input: z.object({ space_id: z.string() }),
  handler: ({ space_id }, { api }) => api.listSpaceTags(space_id),
});

// ── Custom fields ──────────────────────────────────────────────────────────
const listCustomFields = defineTool({
  name: "clickup_list_custom_fields",
  title: "List custom fields",
  readOnly: true,
  description: "List the custom fields available on a List (with their IDs).",
  input: z.object({ list_id: z.string() }),
  handler: ({ list_id }, { api }) => api.listCustomFields(list_id),
});

const setCustomFieldValue = defineTool({
  name: "clickup_set_custom_field_value",
  title: "Set custom field value",
  description:
    "Set a custom field value on a task. The shape of `value` depends on the field type (string, number, array of option IDs, etc.).",
  input: z.object({
    task_id: z.string(),
    field_id: z.string(),
    value: z
      .any()
      .describe("Field value; type depends on the custom field definition."),
    value_options: z
      .record(z.any())
      .optional()
      .describe("Extra options, e.g. { time: true } for date fields."),
  }),
  handler: ({ task_id, field_id, value, value_options }, { api }) =>
    api.setCustomFieldValue(
      task_id,
      field_id,
      compact({ value, value_options }),
    ),
});

const removeCustomFieldValue = defineTool({
  name: "clickup_remove_custom_field_value",
  title: "Remove custom field value",
  destructive: true,
  description: "Clear a custom field value from a task.",
  input: z.object({ task_id: z.string(), field_id: z.string() }),
  handler: async ({ task_id, field_id }, { api }) => {
    await api.removeCustomFieldValue(task_id, field_id);
    return { success: true, task_id, field_id };
  },
});

export const fieldTools: ToolDef[] = [
  getAuthorizedUser,
  listMembers,
  listSpaceTags,
  listCustomFields,
  setCustomFieldValue,
  removeCustomFieldValue,
];

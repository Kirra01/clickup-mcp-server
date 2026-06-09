import { z } from "zod";
import { defineTool, ToolDef } from "../core/registry.js";
import { archivedField, compact, priorityField, userId } from "./common.js";

// ── Workspaces ────────────────────────────────────────────────────────────
const listWorkspaces = defineTool({
  name: "clickup_list_workspaces",
  title: "List workspaces",
  readOnly: true,
  description:
    "List the authorized Workspaces (teams). Start here to discover team_id for other calls.",
  input: z.object({}),
  handler: (_args, { api }) => api.listWorkspaces(),
});

// ── Spaces ────────────────────────────────────────────────────────────────
const listSpaces = defineTool({
  name: "clickup_list_spaces",
  title: "List spaces",
  readOnly: true,
  description: "List the Spaces in a Workspace.",
  input: z.object({ team_id: z.string(), archived: archivedField }),
  handler: ({ team_id, archived }, { api }) => api.listSpaces(team_id, archived),
});

const getSpace = defineTool({
  name: "clickup_get_space",
  title: "Get space",
  readOnly: true,
  description: "Get a single Space's details.",
  input: z.object({ space_id: z.string() }),
  handler: ({ space_id }, { api }) => api.getSpace(space_id),
});

const createSpace = defineTool({
  name: "clickup_create_space",
  title: "Create space",
  description: "Create a Space in a Workspace.",
  input: z.object({
    team_id: z.string(),
    name: z.string(),
    multiple_assignees: z.boolean().optional(),
  }),
  handler: ({ team_id, ...body }, { api }) =>
    api.createSpace(team_id, compact(body)),
});

const updateSpace = defineTool({
  name: "clickup_update_space",
  title: "Update space",
  description: "Update a Space.",
  input: z.object({
    space_id: z.string(),
    name: z.string().optional(),
    multiple_assignees: z.boolean().optional(),
    archived: z.boolean().optional(),
  }),
  handler: ({ space_id, ...body }, { api }) =>
    api.updateSpace(space_id, compact(body)),
});

const deleteSpace = defineTool({
  name: "clickup_delete_space",
  title: "Delete space",
  destructive: true,
  description: "Delete a Space and everything in it.",
  input: z.object({ space_id: z.string() }),
  handler: async ({ space_id }, { api }) => {
    await api.deleteSpace(space_id);
    return { success: true, deleted_space_id: space_id };
  },
});

// ── Folders ───────────────────────────────────────────────────────────────
const listFolders = defineTool({
  name: "clickup_list_folders",
  title: "List folders",
  readOnly: true,
  description: "List the Folders in a Space.",
  input: z.object({ space_id: z.string(), archived: archivedField }),
  handler: ({ space_id, archived }, { api }) =>
    api.listFolders(space_id, archived),
});

const getFolder = defineTool({
  name: "clickup_get_folder",
  title: "Get folder",
  readOnly: true,
  description: "Get a single Folder's details.",
  input: z.object({ folder_id: z.string() }),
  handler: ({ folder_id }, { api }) => api.getFolder(folder_id),
});

const createFolder = defineTool({
  name: "clickup_create_folder",
  title: "Create folder",
  description: "Create a Folder in a Space.",
  input: z.object({ space_id: z.string(), name: z.string() }),
  handler: ({ space_id, name }, { api }) =>
    api.createFolder(space_id, { name }),
});

const updateFolder = defineTool({
  name: "clickup_update_folder",
  title: "Update folder",
  description: "Rename a Folder.",
  input: z.object({ folder_id: z.string(), name: z.string() }),
  handler: ({ folder_id, name }, { api }) =>
    api.updateFolder(folder_id, { name }),
});

const deleteFolder = defineTool({
  name: "clickup_delete_folder",
  title: "Delete folder",
  destructive: true,
  description: "Delete a Folder and the Lists inside it.",
  input: z.object({ folder_id: z.string() }),
  handler: async ({ folder_id }, { api }) => {
    await api.deleteFolder(folder_id);
    return { success: true, deleted_folder_id: folder_id };
  },
});

// ── Lists ───────────────────────────────────────────────────────────────
const listLists = defineTool({
  name: "clickup_list_lists",
  title: "List lists",
  readOnly: true,
  description:
    "List the Lists under a Folder (pass folder_id) OR the folderless Lists directly under a Space (pass space_id). Exactly one of folder_id / space_id is required.",
  input: z
    .object({
      folder_id: z.string().optional(),
      space_id: z.string().optional(),
      archived: archivedField,
    })
    .refine((v) => !!v.folder_id !== !!v.space_id, {
      message: "Provide exactly one of folder_id or space_id.",
    }),
  handler: ({ folder_id, space_id, archived }, { api }) =>
    folder_id
      ? api.listFolderLists(folder_id, archived)
      : api.listFolderlessLists(space_id as string, archived),
});

const getList = defineTool({
  name: "clickup_get_list",
  title: "Get list",
  readOnly: true,
  description: "Get a single List's details (statuses, assignee defaults, etc.).",
  input: z.object({ list_id: z.string() }),
  handler: ({ list_id }, { api }) => api.getList(list_id),
});

const createList = defineTool({
  name: "clickup_create_list",
  title: "Create list",
  description:
    "Create a List inside a Folder (folder_id) or directly under a Space (space_id). Exactly one parent is required.",
  input: z
    .object({
      folder_id: z.string().optional(),
      space_id: z.string().optional(),
      name: z.string(),
      content: z.string().optional().describe("List description."),
      due_date: z.number().int().optional(),
      priority: priorityField,
      assignee: userId.optional(),
      status: z.string().optional(),
    })
    .refine((v) => !!v.folder_id !== !!v.space_id, {
      message: "Provide exactly one of folder_id or space_id.",
    }),
  handler: ({ folder_id, space_id, ...rest }, { api }) => {
    const body = compact(rest);
    return folder_id
      ? api.createListInFolder(folder_id, body)
      : api.createListInSpace(space_id as string, body);
  },
});

const updateList = defineTool({
  name: "clickup_update_list",
  title: "Update list",
  description: "Update a List's name, content, priority, assignee or status.",
  input: z.object({
    list_id: z.string(),
    name: z.string().optional(),
    content: z.string().optional(),
    due_date: z.number().int().optional(),
    priority: priorityField,
    assignee: userId.optional(),
    status: z.string().optional(),
    unset_status: z.boolean().optional(),
  }),
  handler: ({ list_id, ...rest }, { api }) =>
    api.updateList(list_id, compact(rest)),
});

const deleteList = defineTool({
  name: "clickup_delete_list",
  title: "Delete list",
  destructive: true,
  description: "Delete a List and its tasks.",
  input: z.object({ list_id: z.string() }),
  handler: async ({ list_id }, { api }) => {
    await api.deleteList(list_id);
    return { success: true, deleted_list_id: list_id };
  },
});

const createBoard = defineTool({
  name: "clickup_create_board",
  title: "Create board",
  description: "Create a board view container in a Space.",
  input: z.object({ space_id: z.string(), name: z.string() }),
  handler: ({ space_id, name }, { api }) => api.createBoard(space_id, { name }),
});

export const hierarchyTools: ToolDef[] = [
  listWorkspaces,
  listSpaces,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  listFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  listLists,
  getList,
  createList,
  updateList,
  deleteList,
  createBoard,
];

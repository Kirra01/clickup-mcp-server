import { z } from "zod";
import { defineTool, ToolDef } from "../core/registry.js";
import { compact } from "./common.js";

const contentFormat = z
  .string()
  .optional()
  .describe("e.g. text/md or text/html.");

const searchDocs = defineTool({
  name: "clickup_search_docs",
  title: "Search docs",
  readOnly: true,
  description: "List/search Docs in a Workspace (v3).",
  input: z.object({
    workspace_id: z.string().describe("Workspace (team) ID."),
    include_archived: z.boolean().optional(),
  }),
  handler: ({ workspace_id, include_archived }, { api }) =>
    api.searchDocs(workspace_id, compact({ archived: include_archived })),
});

const createDoc = defineTool({
  name: "clickup_create_doc",
  title: "Create doc",
  description: "Create a Doc in a Workspace (v3).",
  input: z.object({
    workspace_id: z.string(),
    name: z.string(),
    parent_id: z
      .string()
      .optional()
      .describe("Parent container ID (used with parent_type)."),
    parent_type: z
      .number()
      .int()
      .optional()
      .describe("Parent type code (e.g. 4=Space, 5=Folder, 6=List, 7=Task)."),
    visibility: z.enum(["public", "private"]).optional(),
    create_page: z.boolean().optional(),
  }),
  handler: ({ workspace_id, name, parent_id, parent_type, ...rest }, { api }) => {
    const body: Record<string, unknown> = compact({ name, ...rest });
    if (parent_id && parent_type !== undefined) {
      body.parent = { id: parent_id, type: parent_type };
    }
    return api.createDoc(workspace_id, body);
  },
});

const listDocPages = defineTool({
  name: "clickup_list_doc_pages",
  title: "List doc pages",
  readOnly: true,
  description: "List the pages of a Doc (v3).",
  input: z.object({ workspace_id: z.string(), doc_id: z.string() }),
  handler: ({ workspace_id, doc_id }, { api }) =>
    api.listDocPages(workspace_id, doc_id),
});

const createDocPage = defineTool({
  name: "clickup_create_doc_page",
  title: "Create doc page",
  description: "Create a page inside a Doc (v3).",
  input: z.object({
    workspace_id: z.string(),
    doc_id: z.string(),
    name: z.string().optional(),
    content: z.string().optional(),
    sub_title: z.string().optional(),
    parent_page_id: z.string().optional(),
    content_format: contentFormat,
  }),
  handler: ({ workspace_id, doc_id, ...body }, { api }) =>
    api.createDocPage(workspace_id, doc_id, compact(body)),
});

const getDocPage = defineTool({
  name: "clickup_get_doc_page",
  title: "Get doc page",
  readOnly: true,
  description: "Get a Doc page including its content (v3).",
  input: z.object({
    workspace_id: z.string(),
    doc_id: z.string(),
    page_id: z.string(),
    content_format: contentFormat,
  }),
  handler: ({ workspace_id, doc_id, page_id, content_format }, { api }) =>
    api.getDocPage(
      workspace_id,
      doc_id,
      page_id,
      compact({ content_format }),
    ),
});

const updateDocPage = defineTool({
  name: "clickup_update_doc_page",
  title: "Update doc page",
  description:
    "Update a Doc page's title/content. content_edit_mode controls whether content replaces, appends or prepends (default replace).",
  input: z.object({
    workspace_id: z.string(),
    doc_id: z.string(),
    page_id: z.string(),
    name: z.string().optional().describe("New page title."),
    content: z.string().optional(),
    sub_title: z.string().optional(),
    content_edit_mode: z.enum(["replace", "append", "prepend"]).optional(),
    content_format: contentFormat,
  }),
  handler: ({ workspace_id, doc_id, page_id, ...body }, { api }) =>
    api.updateDocPage(workspace_id, doc_id, page_id, compact(body)),
});

const replaceInDocPage = defineTool({
  name: "clickup_replace_in_doc_page",
  title: "Replace text in doc page",
  description:
    "Surgically replace an exact text fragment on a Doc page (read-modify-write). Fails if old_string is absent, or matches more than once without replace_all.",
  input: z.object({
    workspace_id: z.string(),
    doc_id: z.string(),
    page_id: z.string(),
    old_string: z.string().min(1).describe("Exact text to find."),
    new_string: z.string().describe("Replacement (empty string to delete)."),
    replace_all: z.boolean().optional(),
    content_format: contentFormat,
  }),
  handler: (a, { api }) => {
    if (a.old_string === a.new_string) {
      throw new Error("old_string and new_string must be different.");
    }
    return api.replaceInDocPage({
      workspaceId: a.workspace_id,
      docId: a.doc_id,
      pageId: a.page_id,
      oldString: a.old_string,
      newString: a.new_string,
      replaceAll: a.replace_all,
      contentFormat: a.content_format,
    });
  },
});

export const docTools: ToolDef[] = [
  searchDocs,
  createDoc,
  listDocPages,
  createDocPage,
  getDocPage,
  updateDocPage,
  replaceInDocPage,
];

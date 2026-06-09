import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { AxiosInstance, Method } from "axios";
import { normalizeError } from "../http/errors.js";

export type ViewParent = "team" | "space" | "folder" | "list";

interface ReqOptions {
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, unknown>;
}

/**
 * Thin, fully-typed wrapper over the ClickUp REST API.
 *
 * Consolidates what were eight separate service classes. Every call routes
 * through `req`, which normalizes failures into `ClickUpApiError` (preserving
 * the HTTP status and ClickUp's own error body) instead of collapsing them into
 * an indistinguishable "Failed to ..." string.
 */
export class ClickUpApi {
  constructor(private readonly http: AxiosInstance) {}

  private async req<T = unknown>(
    method: Method,
    url: string,
    opts: ReqOptions = {},
  ): Promise<T> {
    try {
      const res = await this.http.request<T>({
        method,
        url,
        params: opts.params,
        data: opts.data,
        headers: opts.headers as never,
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, method, url);
    }
  }

  // ── Workspaces (Teams) ────────────────────────────────────────────────
  listWorkspaces() {
    return this.req("GET", "/v2/team");
  }
  getAuthorizedUser() {
    return this.req("GET", "/v2/user");
  }

  // ── Spaces ────────────────────────────────────────────────────────────
  listSpaces(teamId: string, archived?: boolean) {
    return this.req("GET", `/v2/team/${teamId}/space`, {
      params: { archived },
    });
  }
  getSpace(spaceId: string) {
    return this.req("GET", `/v2/space/${spaceId}`);
  }
  createSpace(teamId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/team/${teamId}/space`, { data: body });
  }
  updateSpace(spaceId: string, body: Record<string, unknown>) {
    return this.req("PUT", `/v2/space/${spaceId}`, { data: body });
  }
  deleteSpace(spaceId: string) {
    return this.req("DELETE", `/v2/space/${spaceId}`);
  }
  listSpaceTags(spaceId: string) {
    return this.req("GET", `/v2/space/${spaceId}/tag`);
  }

  // ── Folders ───────────────────────────────────────────────────────────
  listFolders(spaceId: string, archived?: boolean) {
    return this.req("GET", `/v2/space/${spaceId}/folder`, {
      params: { archived },
    });
  }
  getFolder(folderId: string) {
    return this.req("GET", `/v2/folder/${folderId}`);
  }
  createFolder(spaceId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/space/${spaceId}/folder`, { data: body });
  }
  updateFolder(folderId: string, body: Record<string, unknown>) {
    return this.req("PUT", `/v2/folder/${folderId}`, { data: body });
  }
  deleteFolder(folderId: string) {
    return this.req("DELETE", `/v2/folder/${folderId}`);
  }

  // ── Lists ─────────────────────────────────────────────────────────────
  listFolderLists(folderId: string, archived?: boolean) {
    return this.req("GET", `/v2/folder/${folderId}/list`, {
      params: { archived },
    });
  }
  /** Lists that live directly under a Space (not inside any Folder). */
  listFolderlessLists(spaceId: string, archived?: boolean) {
    return this.req("GET", `/v2/space/${spaceId}/list`, {
      params: { archived },
    });
  }
  getList(listId: string) {
    return this.req("GET", `/v2/list/${listId}`);
  }
  createListInFolder(folderId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/folder/${folderId}/list`, { data: body });
  }
  createListInSpace(spaceId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/space/${spaceId}/list`, { data: body });
  }
  updateList(listId: string, body: Record<string, unknown>) {
    return this.req("PUT", `/v2/list/${listId}`, { data: body });
  }
  deleteList(listId: string) {
    return this.req("DELETE", `/v2/list/${listId}`);
  }
  listMembers(listId: string) {
    return this.req("GET", `/v2/list/${listId}/member`);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────
  getTask(taskId: string, params?: Record<string, unknown>) {
    return this.req("GET", `/v2/task/${taskId}`, { params });
  }
  listTasks(listId: string, params?: Record<string, unknown>) {
    return this.req("GET", `/v2/list/${listId}/task`, { params });
  }
  /** Filtered tasks across an entire workspace (team). */
  searchTasks(teamId: string, params?: Record<string, unknown>) {
    return this.req("GET", `/v2/team/${teamId}/task`, { params });
  }
  createTask(listId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/list/${listId}/task`, { data: body });
  }
  updateTask(taskId: string, body: Record<string, unknown>) {
    return this.req("PUT", `/v2/task/${taskId}`, { data: body });
  }
  deleteTask(taskId: string) {
    return this.req("DELETE", `/v2/task/${taskId}`);
  }

  // ── Task comments ─────────────────────────────────────────────────────
  listTaskComments(taskId: string, params?: Record<string, unknown>) {
    return this.req("GET", `/v2/task/${taskId}/comment`, { params });
  }
  createTaskComment(taskId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/task/${taskId}/comment`, { data: body });
  }

  // ── Task tags ─────────────────────────────────────────────────────────
  addTagToTask(taskId: string, tagName: string) {
    return this.req(
      "POST",
      `/v2/task/${taskId}/tag/${encodeURIComponent(tagName)}`,
    );
  }
  removeTagFromTask(taskId: string, tagName: string) {
    return this.req(
      "DELETE",
      `/v2/task/${taskId}/tag/${encodeURIComponent(tagName)}`,
    );
  }

  // ── Task attachments ──────────────────────────────────────────────────
  async createTaskAttachment(taskId: string, filePath: string) {
    const buffer = await readFile(filePath);
    const form = new FormData();
    form.append(
      "attachment",
      new Blob([new Uint8Array(buffer)]),
      basename(filePath),
    );
    // Setting Content-Type to null lets axios derive the multipart boundary
    // instead of inheriting the instance's application/json default.
    return this.req("POST", `/v2/task/${taskId}/attachment`, {
      data: form,
      headers: { "Content-Type": null },
    });
  }

  // ── Custom fields ─────────────────────────────────────────────────────
  listCustomFields(listId: string) {
    return this.req("GET", `/v2/list/${listId}/field`);
  }
  setCustomFieldValue(
    taskId: string,
    fieldId: string,
    body: Record<string, unknown>,
  ) {
    return this.req("POST", `/v2/task/${taskId}/field/${fieldId}`, {
      data: body,
    });
  }
  removeCustomFieldValue(taskId: string, fieldId: string) {
    return this.req("DELETE", `/v2/task/${taskId}/field/${fieldId}`);
  }

  // ── Views ─────────────────────────────────────────────────────────────
  listViews(parentType: ViewParent, parentId: string) {
    return this.req("GET", `/v2/${parentType}/${parentId}/view`);
  }
  getView(viewId: string) {
    return this.req("GET", `/v2/view/${viewId}`);
  }
  getViewTasks(viewId: string, page?: number) {
    return this.req("GET", `/v2/view/${viewId}/task`, { params: { page } });
  }
  createView(
    parentType: ViewParent,
    parentId: string,
    body: Record<string, unknown>,
  ) {
    return this.req("POST", `/v2/${parentType}/${parentId}/view`, {
      data: body,
    });
  }
  updateView(viewId: string, body: Record<string, unknown>) {
    return this.req("PUT", `/v2/view/${viewId}`, { data: body });
  }
  deleteView(viewId: string) {
    return this.req("DELETE", `/v2/view/${viewId}`);
  }

  // ── Boards ────────────────────────────────────────────────────────────
  createBoard(spaceId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v2/space/${spaceId}/board`, { data: body });
  }

  // ── Docs (v3) ─────────────────────────────────────────────────────────
  searchDocs(workspaceId: string, params?: Record<string, unknown>) {
    return this.req("GET", `/v3/workspaces/${workspaceId}/docs`, { params });
  }
  createDoc(workspaceId: string, body: Record<string, unknown>) {
    return this.req("POST", `/v3/workspaces/${workspaceId}/docs`, {
      data: body,
    });
  }
  listDocPages(workspaceId: string, docId: string) {
    return this.req(
      "GET",
      `/v3/workspaces/${workspaceId}/docs/${docId}/pages`,
    );
  }
  createDocPage(
    workspaceId: string,
    docId: string,
    body: Record<string, unknown>,
  ) {
    return this.req(
      "POST",
      `/v3/workspaces/${workspaceId}/docs/${docId}/pages`,
      { data: body },
    );
  }
  getDocPage(
    workspaceId: string,
    docId: string,
    pageId: string,
    params?: Record<string, unknown>,
  ): Promise<{ content?: string | null; [k: string]: unknown }> {
    return this.req(
      "GET",
      `/v3/workspaces/${workspaceId}/docs/${docId}/pages/${pageId}`,
      { params },
    );
  }
  updateDocPage(
    workspaceId: string,
    docId: string,
    pageId: string,
    body: Record<string, unknown>,
  ) {
    return this.req(
      "PUT",
      `/v3/workspaces/${workspaceId}/docs/${docId}/pages/${pageId}`,
      { data: body },
    );
  }

  /**
   * Partial edit of a Doc page by exact-fragment replacement. ClickUp only
   * supports whole-page replace/append/prepend, so we read, splice in memory,
   * verify the match is unambiguous, then write the whole page back.
   */
  async replaceInDocPage(opts: {
    workspaceId: string;
    docId: string;
    pageId: string;
    oldString: string;
    newString: string;
    replaceAll?: boolean;
    contentFormat?: string;
  }) {
    const {
      workspaceId,
      docId,
      pageId,
      oldString,
      newString,
      replaceAll,
      contentFormat,
    } = opts;

    const page = await this.getDocPage(workspaceId, docId, pageId, {
      content_format: contentFormat,
    });
    const current = typeof page.content === "string" ? page.content : "";

    const occurrences = current.split(oldString).length - 1;
    if (occurrences === 0) {
      throw new Error(
        "old_string was not found on the page. Re-read the page and retry.",
      );
    }
    if (occurrences > 1 && !replaceAll) {
      throw new Error(
        `old_string matched ${occurrences} times. Add surrounding context to make it unique, or set replace_all=true.`,
      );
    }

    const next = replaceAll
      ? current.split(oldString).join(newString)
      : current.replace(oldString, newString);

    return this.updateDocPage(workspaceId, docId, pageId, {
      content: next,
      content_edit_mode: "replace",
      content_format: contentFormat,
    });
  }
}

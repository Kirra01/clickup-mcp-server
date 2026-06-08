// MCP Configuration Types
export interface MCPConfig {
  name: string;
  version: string;
  description: string;
  type: "server" | "tool" | "plugin";
  author: string;
  license: string;
  main: string;
  dependencies: Record<string, string>;
  configuration: {
    required: Record<string, ConfigField>;
    optional: Record<string, ConfigField>;
  };
  commands: Record<string, Command>;
  hooks?: {
    preinstall?: string;
    postinstall?: string;
  };
  logging: {
    format: "json" | "text";
    destination: string;
  };
}

interface ConfigField {
  type: "string" | "number" | "boolean";
  description: string;
  default?: any;
  enum?: string[];
}

interface Command {
  description: string;
  script: string;
  args: string[];
}

// Existing ClickUp Types
export interface ClickUpTask {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  assignees?: string[];
  due_date?: string;
  time_estimate?: string;
  list_id?: string;
  space_id?: string;
  folder_id?: string;
  tags?: string[];
}

export interface ClickUpList {
  id: string;
  name: string;
  content: string;
  status: {
    status: string;
    type: string;
    orderindex: number;
  };
}

export interface ClickUpBoard {
  id?: string;
  name: string;
  content?: string;
  space_id: string;
}

export interface ClickUpTeam {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  members: Array<{
    user: {
      id: number;
      username: string;
      email: string;
      color: string;
      profilePicture?: string;
    };
    role: number;
  }>;
}

export interface Column {
  id: string;
  name: string;
  statuses: Status[];
}

export interface Status {
  id: string;
  status: string;
  color: string;
}

// Server Configuration Types
export interface ServerConfig {
  port: number;
  logLevel: string;
}

// Update Config interface to remove OAuth part
export interface Config {
  server: ServerConfig;
  // clickUp: OAuthConfig; // Removed
  clickUpPersonalToken: string;
  clickUpApiUrl: string;
  encryptionKey: string;
}

// MCP Tool Types
export interface ToolResponse<T = any> {
  content: Array<{
    type: string;
    text: string;
  }>;
  data?: T;
}

// +++ Space Types +++
export interface ClickUpSpaceFeature {
  enabled: boolean;
  // Add other properties if needed based on API response
}

export interface ClickUpSpaceFeatures {
  due_dates?: ClickUpSpaceFeature;
  time_tracking?: ClickUpSpaceFeature;
  tags?: ClickUpSpaceFeature;
  time_estimates?: ClickUpSpaceFeature;
  checklists?: ClickUpSpaceFeature;
  custom_fields?: ClickUpSpaceFeature;
  remap_dependencies?: ClickUpSpaceFeature;
  dependency_warning?: ClickUpSpaceFeature;
  portfolios?: ClickUpSpaceFeature;
  // Add other features as they appear in API responses
}

export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  color: string | null;
  avatar: string | null;
  admin_can_manage?: boolean;
  archived?: boolean;
  features?: ClickUpSpaceFeatures;
  // Add other relevant properties from API response (e.g., statuses, members)
}

export interface GetSpacesParams {
  team_id: string; // This is Workspace ID
  archived?: boolean;
}

export interface CreateSpaceParams {
  team_id: string; // Path parameter (Workspace ID)
  name: string;
  multiple_assignees?: boolean;
  features?: {
    due_dates?: {
      enabled: boolean;
      start_date: boolean;
      remap_due_dates: boolean;
    };
    time_tracking?: { enabled: boolean };
    tags?: { enabled: boolean };
    time_estimates?: { enabled: boolean };
    checklists?: { enabled: boolean };
    custom_fields?: { enabled: boolean };
    remap_dependencies?: { enabled: boolean };
    dependency_warning?: { enabled: boolean };
    portfolios?: { enabled: boolean };
  };
}

export interface UpdateSpaceParams {
  space_id: string; // Path parameter
  name?: string;
  color?: string | null;
  private?: boolean;
  admin_can_manage?: boolean;
  archived?: boolean;
  features?: {
    due_dates?: {
      enabled: boolean;
      start_date: boolean;
      remap_due_dates: boolean;
    };
    time_tracking?: { enabled: boolean };
    tags?: { enabled: boolean };
    time_estimates?: { enabled: boolean };
    checklists?: { enabled: boolean };
    custom_fields?: { enabled: boolean };
    remap_dependencies?: { enabled: boolean };
    dependency_warning?: { enabled: boolean };
    portfolios?: { enabled: boolean };
  };
}

export interface DeleteSpaceParams {
  space_id: string; // Path parameter
}

// +++ Folder Types +++
export interface ClickUpFolder {
  id: string;
  name: string;
  orderindex: number;
  override_statuses: boolean;
  hidden: boolean;
  space: {
    id: string;
    name: string;
    access: boolean; // true if user has access to space
  };
  task_count: string; // API returns as string
  archived: boolean;
  lists: any[]; // Define ClickUpList interface if not already present and needed here
  // Add other relevant properties from API response
}

export interface GetFoldersParams {
  space_id: string;
  archived?: boolean;
}

export interface CreateFolderParams {
  space_id: string; // Path parameter
  name: string;
}

export interface UpdateFolderParams {
  folder_id: string; // Path parameter
  name?: string;
}

export interface DeleteFolderParams {
  folder_id: string; // Path parameter
}

// +++ List Types +++
export interface ClickUpListSpaceInfo {
  id: string;
  name: string;
  // No 'access' field here, as it's context-dependent in some API responses for list.
}

export interface ClickUpListFolderInfo {
  id: string;
  name: string;
  hidden: boolean;
  access: boolean;
}

export interface ClickUpListStatus {
  // Simplified status object if needed for list context
  status: string;
  color: string;
  type: string;
  orderindex: number;
}

export interface ClickUpListFull {
  id: string;
  name: string;
  orderindex: number;
  content?: string | null; // Description of the list
  status?: ClickUpListStatus | null; // Often null for the list itself, or default task status
  priority?: any | null; // Define specific type if priority object is complex
  assignee?: any | null; // Define specific type if assignee object is complex
  task_count?: string; // API often returns as string
  due_date?: string | null;
  start_date?: string | null;
  archived: boolean;
  override_statuses: boolean;
  statuses?: ClickUpListStatus[]; // Actual task statuses configured for this list
  permission_level?: string;
  space: ClickUpListSpaceInfo;
  folder: ClickUpListFolderInfo;
  // Add other fields like 'team_id' (workspace_id) if consistently returned and useful
}

export interface CreateListParams {
  parent_id: string; // ID of the folder or space
  parent_type: "folder" | "space";
  name: string;
  content?: string; // List description
  // ClickUp API for list creation (v2) primarily takes 'name'. Other fields might be set via update or defaults.
  // Check API documentation if more fields are directly settable on creation.
  // For now, keeping it simple based on common patterns for POST /folder/{id}/list or POST /space/{id}/list
  // Optional fields based on typical ClickUp list creation body:
  due_date?: number; // Timestamp in ms
  due_date_time?: boolean; // If due_date includes time
  priority?: number; // 1 (urgent) to 4 (low)
  assignee?: number; // User ID for default assignee
  status?: string; // Default status for tasks (string name)
}

// Response type for operations that don't return significant data
export interface ClickUpSuccessResponse {
  // ClickUp often returns an empty object {} on success for DELETE/PUT operations.
  // This can be expanded if specific success indicators are found.
}

// +++ Custom Field Types +++
export interface ClickUpCustomFieldOption {
  id: string;
  name: string;
  color?: string;
  orderindex?: string | number; // API docs show string, but number is also possible
  label?: string; // For label type
}

export interface ClickUpCustomFieldTypeConfig {
  // For dropdown
  default?: number | string; // Can be index or option id
  placeholder?: string;
  options?: ClickUpCustomFieldOption[];
  new_drop_down?: boolean; // If creating a new dropdown

  // For currency
  precision?: number;
  currency_type?: string;

  // For emoji (rating)
  code_point?: string;
  count?: number; // Max rating value (1-5)

  // For labels
  // Uses 'options' from ClickUpCustomFieldOption where 'name' becomes 'label'
  // sorting?: 'manual' | 'name_asc' | 'name_desc'; // Not directly modifiable via set field value

  // For progress (automatic/manual)
  method?: "automatic" | "manual";
  tracking?: {
    subtasks?: boolean;
    assigned_comments?: boolean;
    checklists?: boolean;
  };
  start?: number;
  end?: number;
  // current?: number; // 'current' is part of the value, not type_config for manual progress

  // Add other type_config structures as needed
  // Example: for 'users' or 'tasks' type, it might be empty or have specific flags.
}

export interface ClickUpCustomField {
  id: string;
  name: string;
  type: string; // e.g., 'text', 'drop_down', 'number', 'labels', 'date', etc.
  type_config: ClickUpCustomFieldTypeConfig;
  date_created: string;
  hide_from_guests: boolean;
  required?: boolean; // Not always present, but can be
  // value?: any; // Value is typically part of the task's custom_fields array, not the definition from /field endpoint
}

export interface GetCustomFieldsParams {
  list_id: string;
  // Potentially add folder_id, space_id, team_id later if needed
}

export interface SetTaskCustomFieldValueParams {
  task_id: string;
  field_id: string;
  value: any;
  value_options?: {
    // e.g. for date custom field to include time
    time?: boolean;
  };
}

export interface RemoveTaskCustomFieldValueParams {
  task_id: string;
  field_id: string;
}

// +++ Doc Types +++
// Based on research, Docs API has limitations and might involve v3 endpoints for some operations.
// These types are an initial proposal and might need refinement based on actual v2/v3 API responses.

export interface ClickUpDoc {
  id: string;
  // team_id?: string; // or workspace_id depending on API version
  // space_id?: string;
  // folder_id?: string; // Docs can be homed in various places
  // list_id?: string;
  view_id?: string; // Docs can also be views
  parent_id?: string | null; // ID of the parent (Space, Folder, List, Task)
  parent_type?: string | null; // Type of the parent ('space', 'folder', 'list', 'task')
  name: string;
  tags?: string[];
  date_created?: string;
  creator?: number; // user ID
  settings?: {
    show_navigation?: boolean;
    show_comments?: boolean;
    show_tasks?: boolean;
    // ... other settings
  };
  archived?: boolean;
  // Content itself might be handled via pages
}

export interface ClickUpDocPage {
  id: string;
  doc_id: string;
  orderindex: number;
  title: string; // Or name
  content?: string | null; // Allow null as API might return this
  date_created?: string;
  date_updated?: string;
}

export interface SearchDocsParams {
  team_id: string; // Workspace ID
  query?: string;
  include_archived?: boolean;
  // space_ids, folder_ids, list_ids, task_ids for filtering might be possible
}

export interface CreateDocParams {
  workspace_id: string; // Path parameter, maps to workspaceId (number) in spec
  name: string; // Required in body
  parent?: {
    id: string; // ID of the parent (Doc, Space, Folder, List etc.)
    type: number; // Numeric type: 4 for Space, 5 for Folder, 6 for List, 7 for Everything, 12 for Workspace.
  };
  visibility?: "private" | "workspace" | "public"; // Or just string if API is flexible
  create_page?: boolean; // Defaults to true as per spec example and common sense
  // 'content' is removed as it's handled by page creation/editing.
}

export interface GetDocPagesParams {
  workspace_id?: string; // Added for v3
  doc_id: string;
}

export interface CreateDocPageParams {
  workspace_id: string; // Added: Required for v3 endpoint path
  doc_id: string;
  name: string; // Changed from title to match API spec
  content?: string; // Markdown content
  orderindex?: number; // Note: OpenAPI spec for v3 createPage doesn't show orderindex. This might be v2 or handled differently.
  parent_page_id?: string; // Optional: As per v3 spec
  sub_title?: string; // Optional: As per v3 spec
  content_format?: string; // Optional: As per v3 spec (defaults to text/md)
}

export interface GetDocPageContentParams {
  workspace_id: string; // Added: Required for v3 endpoint path
  doc_id: string; // Added: Required for v3 endpoint path
  page_id: string;
  content_format?: string; // Optional: As per v3 spec (e.g. text/md)
}

export interface EditDocPageContentParams {
  workspace_id: string; // Added: Required for v3 endpoint path
  doc_id: string; // Added: Required for v3 endpoint path
  page_id: string;
  content: string; // Markdown content (maps to API 'content')
  title?: string; // Optional: if title can also be updated here (maps to API 'name')
  sub_title?: string; // Optional: As per v3 spec
  content_edit_mode?: "replace" | "append" | "prepend"; // Optional: As per v3 spec
  content_format?: string; // Optional: As per v3 spec (defaults to text/md)
}

export interface ReplaceInDocPageParams {
  workspace_id: string; // Required for v3 endpoint path
  doc_id: string; // Required for v3 endpoint path
  page_id: string;
  old_string: string; // Exact text fragment to find in the current page content
  new_string: string; // Text that replaces old_string
  replace_all?: boolean; // Optional: replace every occurrence (default: false = require a unique match)
  content_format?: string; // Optional: format used for both reading and writing (defaults to text/md)
}

// +++ View Types +++
export type ClickUpViewParentType = "team" | "space" | "folder" | "list"; // Enum for parent type strings used in handlers
export type ClickUpViewType = "list" | "board" | "calendar" | "gantt"; // Supported view types

// Interfaces for View Settings (based on API docs for Create/Update View)
export interface ClickUpViewFilterField {
  field: string; // e.g., 'assignee', 'status', 'dueDate', 'cf_{id}'
  op: string; // e.g., 'EQ', 'NOT', 'ANY', 'GT', 'LT', 'IS SET'
  values: any[]; // Can be array of strings, numbers, objects (like for date filters)
}

export interface ClickUpViewFilterSettings {
  op: "AND" | "OR";
  fields: ClickUpViewFilterField[];
  search?: string; // Optional search string
  show_closed?: boolean;
}

export interface ClickUpViewSortField {
  field: string; // e.g., 'status', 'priority', 'dueDate', 'cf_{id}'
  dir: number; // 1 for asc, -1 for desc (API might use 1/-1 or string 'asc'/'desc', confirm API response/request format)
}

export interface ClickUpViewSortSettings {
  fields: ClickUpViewSortField[];
}

export interface ClickUpViewGroupingSettings {
  field: string; // e.g., 'status', 'priority', 'assignee', 'cf_{id}'
  dir: number; // 1 for asc, -1 for desc
  collapse?: boolean; // Optional
}

export interface ClickUpViewColumnField {
  field: string; // e.g., 'assignee', 'status', 'cf_{id}'
  // Additional properties like width might exist
}

export interface ClickUpViewColumnSettings {
  fields: ClickUpViewColumnField[];
}

// Interface for the main View object
export interface ClickUpView {
  id: string;
  name: string;
  type: ClickUpViewType;
  parent: {
    id: string | number; // API often uses number for team ID (7), string otherwise
    type: number; // 7=team, 4=space, 5=folder, 6=list
  };
  grouping: ClickUpViewGroupingSettings;
  divide?: any; // Gantt specific?
  sorting: ClickUpViewSortSettings;
  filters: ClickUpViewFilterSettings;
  columns: ClickUpViewColumnSettings;
  team_sidebar?: {
    assignees?: any[];
    assigned_comments?: boolean;
    unassigned_tasks?: boolean;
    // ... other sidebar settings
  };
  settings?: {
    show_task_locations?: boolean;
    show_subtasks?: number; // e.g., 1 (expanded), 2 (compact), 3 (off)
    show_closed_subtasks?: boolean;
    show_assignees?: boolean;
    show_images?: boolean;
    collapse_empty_columns?: boolean | null;
    me_comments?: boolean;
    me_subtasks?: boolean;
    me_checklists?: boolean;
    // ... other view-specific settings
  };
  date_created?: string;
  creator?: number;
  orderindex?: number;
  task_count?: number;
  // Add other fields as needed from API responses
}

// Parameter types for View tools
export interface GetViewsParams {
  parent_id: string;
  parent_type: ClickUpViewParentType;
}

export interface CreateViewParams {
  parent_id: string;
  parent_type: ClickUpViewParentType;
  name: string;
  type: ClickUpViewType;
  // Making settings optional, user can provide specific parts
  grouping?: ClickUpViewGroupingSettings;
  divide?: any;
  sorting?: ClickUpViewSortSettings;
  filters?: ClickUpViewFilterSettings;
  columns?: ClickUpViewColumnSettings;
  team_sidebar?: any;
  settings?: any; // Keep general for flexibility
}

export interface GetViewDetailsParams {
  view_id: string;
}

export interface UpdateViewParams {
  view_id: string;
  name?: string;
  // Allow updating individual settings parts
  grouping?: ClickUpViewGroupingSettings;
  divide?: any;
  sorting?: ClickUpViewSortSettings;
  filters?: ClickUpViewFilterSettings;
  columns?: ClickUpViewColumnSettings;
  team_sidebar?: any;
  settings?: any;
}

export interface DeleteViewParams {
  view_id: string;
}

export interface GetViewTasksParams {
  view_id: string;
  page?: number; // For pagination
}

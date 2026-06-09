import type { ToolDef } from "../core/registry.js";
import { taskTools } from "../tools/tasks.js";
import { hierarchyTools } from "../tools/hierarchy.js";

function findTool(arr: ToolDef[], name: string): ToolDef {
  const tool = arr.find((t) => t.name === name);
  if (!tool) throw new Error(`tool not found: ${name}`);
  return tool;
}

describe("clickup_update_task", () => {
  const tool = findTool(taskTools, "clickup_update_task");

  it("transforms add/remove assignees into ClickUp's {add, rem} form", async () => {
    const calls: Array<{ id: string; body: Record<string, unknown> }> = [];
    const api = {
      updateTask: (id: string, body: Record<string, unknown>) => {
        calls.push({ id, body });
        return Promise.resolve({});
      },
    };

    await tool.handler(
      { task_id: "t1", name: "x", add_assignees: [1, 2], remove_assignees: [3] },
      { api } as never,
    );

    expect(calls[0].id).toBe("t1");
    expect(calls[0].body.assignees).toEqual({ add: [1, 2], rem: [3] });
    expect(calls[0].body.name).toBe("x");
    // The raw add_/remove_ keys must not leak through to the API.
    expect(calls[0].body).not.toHaveProperty("add_assignees");
    expect(calls[0].body).not.toHaveProperty("remove_assignees");
  });

  it("omits the assignees field entirely when none are provided", async () => {
    const calls: Array<{ body: Record<string, unknown> }> = [];
    const api = {
      updateTask: (_id: string, body: Record<string, unknown>) => {
        calls.push({ body });
        return Promise.resolve({});
      },
    };

    await tool.handler({ task_id: "t1", status: "done" }, { api } as never);

    expect(calls[0].body).not.toHaveProperty("assignees");
    expect(calls[0].body.status).toBe("done");
  });
});

describe("clickup_list_lists validation", () => {
  const tool = findTool(hierarchyTools, "clickup_list_lists");

  it("requires exactly one of folder_id / space_id", () => {
    expect(tool.input.safeParse({}).success).toBe(false);
    expect(
      tool.input.safeParse({ folder_id: "f", space_id: "s" }).success,
    ).toBe(false);
    expect(tool.input.safeParse({ folder_id: "f" }).success).toBe(true);
    expect(tool.input.safeParse({ space_id: "s" }).success).toBe(true);
  });
});

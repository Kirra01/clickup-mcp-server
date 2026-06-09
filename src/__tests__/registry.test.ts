import { z } from "zod";
import { defineTool, toMcpTool, buildRegistry } from "../core/registry.js";

const sample = defineTool({
  name: "sample",
  description: "A sample tool",
  input: z.object({ a: z.string(), b: z.number().optional() }),
  handler: async () => ({ ok: true }),
});

describe("toMcpTool", () => {
  it("converts a zod input into a JSON object schema", () => {
    const tool = toMcpTool(sample);
    expect(tool.name).toBe("sample");
    expect(tool.inputSchema.type).toBe("object");
    const props = (tool.inputSchema as { properties: Record<string, { type: string }> })
      .properties;
    expect(props.a.type).toBe("string");
    expect((tool.inputSchema as { required?: string[] }).required).toContain("a");
  });

  it("strips the $schema key the client does not expect", () => {
    expect(toMcpTool(sample).inputSchema).not.toHaveProperty("$schema");
  });

  it("exposes read-only / destructive hints via annotations", () => {
    const ro = defineTool({
      name: "ro",
      description: "d",
      readOnly: true,
      input: z.object({}),
      handler: async () => ({}),
    });
    expect(toMcpTool(ro).annotations?.readOnlyHint).toBe(true);
  });
});

describe("buildRegistry", () => {
  it("indexes tools by name", () => {
    const reg = buildRegistry([sample]);
    expect(reg.get("sample")).toBe(sample);
    expect(reg.size).toBe(1);
  });

  it("rejects duplicate tool names", () => {
    expect(() => buildRegistry([sample, sample])).toThrow(/Duplicate/);
  });
});

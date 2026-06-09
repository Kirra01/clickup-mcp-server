import { z } from "zod";

/** Drop keys whose value is `undefined` so we never send them to ClickUp. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export const archivedField = z
  .boolean()
  .optional()
  .describe("Include archived items.");

export const priorityField = z
  .number()
  .int()
  .min(1)
  .max(4)
  .optional()
  .describe("Priority: 1=Urgent, 2=High, 3=Normal, 4=Low.");

/** Assignee user IDs are numeric in ClickUp; accept numbers or numeric strings. */
export const userId = z.union([z.number().int(), z.string()]);

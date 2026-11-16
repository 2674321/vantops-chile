import { describe, expect, it } from "vitest";
import { getDefaultChecklist } from "./engine";
import { normalizeChecklistQuery, searchChecklistItems } from "./checklistSearch";

describe("checklist search", () => {
  it("is accent-insensitive and combines words", () => {
    expect(normalizeChecklistQuery("  Hélices   OPERACIÓN ")).toBe("helices operacion");
    const items = getDefaultChecklist();
    const result = searchChecklistItems(items, [], { search: "helices" });
    expect(result.some((item) => item.title.toLocaleLowerCase("es-CL").includes("hélice"))).toBe(true);
  });

  it("filters checked items independently", () => {
    const items = getDefaultChecklist();
    const first = items[0];
    expect(searchChecklistItems(items, [{ itemId: first.id, checked: true }], { filter: "completed" })).toEqual([first]);
  });
});

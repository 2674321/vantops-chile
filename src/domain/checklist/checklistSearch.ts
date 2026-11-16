import { CATEGORY_LABELS } from "./defaultChecklist";
import type { ChecklistCategory, ChecklistItem, ChecklistState } from "./types";
export type ChecklistFilter = "all" | "pending" | "completed" | "required";
export function normalizeChecklistQuery(value: string): string { return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-CL").trim().replace(/\s+/g, " "); }
export function searchChecklistItems(items: ChecklistItem[], states: ChecklistState[], options: { search?: string; category?: ChecklistCategory | "all"; filter?: ChecklistFilter }): ChecklistItem[] {
  const query = normalizeChecklistQuery(options.search ?? ""); const completed = new Set(states.filter((state) => state.checked).map((state) => state.itemId));
  return items.filter((item) => { if (options.category && options.category !== "all" && item.category !== options.category) return false; const checked = completed.has(item.id); if (options.filter === "pending" && checked) return false; if (options.filter === "completed" && !checked) return false; if (options.filter === "required" && !item.required) return false; if (!query) return true; const text = normalizeChecklistQuery([item.title, item.description ?? "", item.comment ?? "", CATEGORY_LABELS[item.category], item.regulatoryReference?.document ?? ""].join(" ")); return query.split(" ").every((term) => text.includes(term)); });
}

import type { ChecklistState, ChecklistSnapshot } from "../domain/checklist/types";

const STORAGE_KEY = "vantops:checklist";

export function loadChecklistState(): ChecklistState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChecklistSnapshot;
    if (Array.isArray(parsed.states)) {
      return parsed.states.filter(
        (s) =>
          typeof s.itemId === "string" &&
          typeof s.checked === "boolean"
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function saveChecklistState(states: ChecklistState[]): void {
  try {
    const snapshot: ChecklistSnapshot = {
      id: "current",
      states,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage full or unavailable
  }
}

export function clearChecklistState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

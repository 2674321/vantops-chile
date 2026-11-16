import type { ChecklistState, ChecklistSnapshot } from "../domain/checklist/types";

const STORAGE_KEY = "vantops:checklist";
function storageKey(scope?: string): string { return scope ? `${STORAGE_KEY}:${scope.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80)}` : STORAGE_KEY; }

export function loadChecklistState(scope?: string): ChecklistState[] {
  try {
    const raw = localStorage.getItem(storageKey(scope));
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

export function saveChecklistState(states: ChecklistState[], scope?: string): void {
  try {
    const snapshot: ChecklistSnapshot = {
      id: "current",
      states,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(scope), JSON.stringify(snapshot));
  } catch {
    // storage full or unavailable
  }
}

export function clearChecklistState(scope?: string): void {
  try {
    localStorage.removeItem(storageKey(scope));
  } catch {
    // ignore
  }
}

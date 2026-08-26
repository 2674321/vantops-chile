// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

const STORAGE_KEY = "vantops:checklist";

let store: Record<string, string>;

beforeEach(() => {
  store = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  });
});

import { loadChecklistState, saveChecklistState, clearChecklistState } from "./checklists";
import type { ChecklistState } from "../domain/checklist/types";

const mockStates: ChecklistState[] = [
  { itemId: "doc-revisados", checked: true, checkedAt: "2026-08-26T12:00:00Z" },
  { itemId: "equ-control", checked: false },
];

describe("checklist persistence", () => {
  it("returns empty array when nothing stored", () => {
    expect(loadChecklistState()).toEqual([]);
  });

  it("saves and loads state", () => {
    saveChecklistState(mockStates);
    const loaded = loadChecklistState();
    expect(loaded.length).toBe(2);
    expect(loaded[0].itemId).toBe("doc-revisados");
    expect(loaded[0].checked).toBe(true);
  });

  it("preserves checkedAt timestamp", () => {
    saveChecklistState(mockStates);
    const loaded = loadChecklistState();
    expect(loaded[0].checkedAt).toBe("2026-08-26T12:00:00Z");
  });

  it("clear removes stored state", () => {
    saveChecklistState(mockStates);
    clearChecklistState();
    expect(loadChecklistState()).toEqual([]);
  });

  it("overwrites previous state", () => {
    saveChecklistState(mockStates);
    const newStates: ChecklistState[] = [
      { itemId: "aero-helices", checked: true, checkedAt: new Date().toISOString() },
    ];
    saveChecklistState(newStates);
    const loaded = loadChecklistState();
    expect(loaded.length).toBe(1);
    expect(loaded[0].itemId).toBe("aero-helices");
  });

  it("handles corrupt data gracefully", () => {
    store[STORAGE_KEY] = "not-json";
    expect(loadChecklistState()).toEqual([]);
  });

  it("handles missing states array", () => {
    store[STORAGE_KEY] = JSON.stringify({ id: "x" });
    expect(loadChecklistState()).toEqual([]);
  });

  it("filters invalid entries", () => {
    store[STORAGE_KEY] = JSON.stringify({
      states: [
        { itemId: "ok", checked: true },
        { checked: true },
        { itemId: "bad", checked: "yes" },
      ],
    });
    const loaded = loadChecklistState();
    expect(loaded.length).toBe(1);
    expect(loaded[0].itemId).toBe("ok");
  });
});

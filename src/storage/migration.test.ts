import { describe, it, expect, vi, beforeEach } from "vitest";
import { isMigrated, clearMigrationFlag } from "./migration";

describe("migration", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem(key: string) { return store[key] ?? null; },
      setItem(key: string, value: string) { store[key] = value; },
      removeItem(key: string) { delete store[key]; },
      clear() { for (const k of Object.keys(store)) delete store[k]; },
    });
  });

  it("isMigrated returns false by default", () => {
    expect(isMigrated()).toBe(false);
  });

  it("isMigrated returns true after setting flag", () => {
    localStorage.setItem("vantops:migrated-to-idb", "true");
    expect(isMigrated()).toBe(true);
  });

  it("clearMigrationFlag removes the flag", () => {
    localStorage.setItem("vantops:migrated-to-idb", "true");
    clearMigrationFlag();
    expect(isMigrated()).toBe(false);
  });
});

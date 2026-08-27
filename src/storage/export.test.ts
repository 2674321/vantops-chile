import { describe, it, expect } from "vitest";
import { validateBackup } from "./export";
import type { BackupData } from "./export";

describe("validateBackup", () => {
  it("accepts valid backup", () => {
    const backup: BackupData = {
      format: "vantops-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "0.6.0",
      flights: [],
      batteries: [],
      places: [],
      settings: {},
    };
    expect(validateBackup(backup)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateBackup(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(validateBackup("string")).toBe(false);
  });

  it("rejects wrong format", () => {
    expect(validateBackup({ format: "wrong", version: 1, flights: [], batteries: [] })).toBe(false);
  });

  it("rejects missing version", () => {
    expect(validateBackup({ format: "vantops-backup", flights: [], batteries: [] })).toBe(false);
  });

  it("rejects non-array flights", () => {
    expect(validateBackup({ format: "vantops-backup", version: 1, flights: "not-array", batteries: [] })).toBe(false);
  });

  it("rejects non-array batteries", () => {
    expect(validateBackup({ format: "vantops-backup", version: 1, flights: [], batteries: "not-array" })).toBe(false);
  });

  it("rejects non-array places", () => {
    expect(validateBackup({
      format: "vantops-backup", version: 1, flights: [], batteries: [],
      places: "not-array",
    })).toBe(false);
  });

  it("accepts backup with all data", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      exportedAt: "2026-08-27T00:00:00Z",
      appVersion: "0.6.0",
      flights: [
        {
          id: "f1",
          startedAt: "2026-08-26T12:00:00Z",
          coordinate: { latitude: -33.45, longitude: -70.65 },
          createdAt: "2026-08-26T12:00:00Z",
          updatedAt: "2026-08-26T12:00:00Z",
        },
      ],
      batteries: [
        {
          id: "b1",
          name: "Bat 1",
          cycleCount: 5,
          createdAt: "2026-08-26T12:00:00Z",
          updatedAt: "2026-08-26T12:00:00Z",
        },
      ],
      places: [
        {
          id: "p1",
          name: "Club",
          coordinate: { latitude: -33.45, longitude: -70.65 },
          createdAt: "2026-08-26T12:00:00Z",
          updatedAt: "2026-08-26T12:00:00Z",
        },
      ],
      settings: { lastCoordinate: { latitude: -33.45, longitude: -70.65 } },
    };
    expect(validateBackup(backup)).toBe(true);
  });

  it("accepts backup without places (backward compatible)", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      exportedAt: "2026-08-27T00:00:00Z",
      appVersion: "0.5.0",
      flights: [],
      batteries: [],
    };
    expect(validateBackup(backup)).toBe(true);
  });
});

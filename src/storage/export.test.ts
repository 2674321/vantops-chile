import { describe, it, expect } from "vitest";
import { validateBackup, inspectBackup, countImportableSettings, MAX_BACKUP_VERSION, MIN_BACKUP_VERSION } from "./export";
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

  it("rejects backup with future/incompatible version", () => {
    const backup = {
      format: "vantops-backup",
      version: MAX_BACKUP_VERSION + 1,
      exportedAt: "2026-09-17T00:00:00Z",
      appVersion: "9.9.9",
      flights: [],
      batteries: [],
    };
    expect(validateBackup(backup)).toBe(false);
    const inspection = inspectBackup(backup);
    expect(inspection.ok).toBe(false);
    if (!inspection.ok) {
      expect(inspection.error).toMatch(/no compatible/);
    }
  });

  it("rejects backup with older-than-supported version", () => {
    const backup = {
      format: "vantops-backup",
      version: MIN_BACKUP_VERSION - 1,
      exportedAt: "2020-01-01T00:00:00Z",
      appVersion: "0.0.1",
      flights: [],
      batteries: [],
    };
    expect(inspectBackup(backup).ok).toBe(false);
  });

  it("rejects non-integer version", () => {
    const backup = {
      format: "vantops-backup",
      version: 1.5,
      flights: [],
      batteries: [],
    };
    expect(validateBackup(backup)).toBe(false);
  });

  it("rejects invalid exportedAt", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      exportedAt: "not-a-date",
      appVersion: "0.6.0",
      flights: [],
      batteries: [],
    };
    expect(validateBackup(backup)).toBe(false);
  });

  it("rejects corrupted flight records (bad coordinate)", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      exportedAt: "2026-08-27T00:00:00Z",
      appVersion: "0.6.0",
      flights: [
        {
          id: "f1",
          startedAt: "2026-08-26T12:00:00Z",
          coordinate: { latitude: 999, longitude: -70.65 },
          createdAt: "2026-08-26T12:00:00Z",
          updatedAt: "2026-08-26T12:00:00Z",
        },
      ],
      batteries: [],
      places: [],
    };
    expect(validateBackup(backup)).toBe(true);
    const inspection = inspectBackup(backup);
    expect(inspection.ok).toBe(false);
    if (!inspection.ok) {
      expect(inspection.error).toMatch(/vuelos/);
    }
  });

  it("rejects corrupted flight records (missing id)", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [
        {
          startedAt: "2026-08-26T12:00:00Z",
          coordinate: { latitude: -33, longitude: -70 },
        },
      ],
      batteries: [],
    };
    expect(inspectBackup(backup).ok).toBe(false);
  });

  it("rejects corrupted battery records", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [
        {
          id: "b1",
          name: "Bat",
          cycleCount: "many",
          createdAt: "2026-08-26T12:00:00Z",
          updatedAt: "2026-08-26T12:00:00Z",
        },
      ],
    };
    expect(inspectBackup(backup).ok).toBe(false);
  });

  it("rejects corrupted place records (bad coordinate)", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [],
      places: [
        {
          id: "p1",
          name: "Club",
          coordinate: { latitude: -91, longitude: -70 },
          createdAt: "2026-08-26T12:00:00Z",
          updatedAt: "2026-08-26T12:00:00Z",
        },
      ],
    };
    expect(inspectBackup(backup).ok).toBe(false);
  });

  it("rejects non-object settings", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [],
      settings: [],
    };
    expect(validateBackup(backup)).toBe(false);
  });

  it("rejects array settings value for importable key", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [],
      settings: { flightLimits: [] },
    };
    expect(validateBackup(backup)).toBe(false);
  });

  it("accepts a numeric operation radius setting", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [],
      settings: { operationZoneRadius: 1000 },
    };
    expect(validateBackup(backup)).toBe(true);
  });

  it("rejects a non-numeric operation radius setting", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [],
      settings: { operationZoneRadius: "1000" },
    };
    expect(validateBackup(backup)).toBe(false);
  });

  it("rejects a non-finite operation radius setting", () => {
    const backup = {
      format: "vantops-backup",
      version: 1,
      flights: [],
      batteries: [],
      settings: { operationZoneRadius: null },
    };
    expect(validateBackup(backup)).toBe(false);
  });

  it("countImportableSettings counts operationZoneRadius", () => {
    expect(
      countImportableSettings({
        operationZoneRadius: 1000,
      })
    ).toBe(1);
  });

  it("countImportableSettings counts only compatible keys", () => {
    expect(countImportableSettings(undefined)).toBe(0);
    expect(countImportableSettings({})).toBe(0);
    expect(
      countImportableSettings({
        flightLimits: { windMaxKmh: 30 },
        activeAircraft: { id: "a", name: "x" },
        lastCoordinate: { latitude: -33, longitude: -70 },
        ephemeralThing: { foo: 1 },
      })
    ).toBe(3);
  });
});

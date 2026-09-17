import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

if (typeof globalThis.CustomEvent === "undefined") {
  class CustomEventPolyfill<T = unknown> extends Event {
    detail: T;
    constructor(type: string, params?: { detail?: T }) {
      super(type);
      this.detail = params?.detail as T;
    }
  }
  (globalThis as unknown as { CustomEvent: typeof CustomEvent }).CustomEvent =
    CustomEventPolyfill as unknown as typeof CustomEvent;
}
import { getDB, resetDB } from "./db";
import { exportBackup, importBackup, inspectBackup, BackupValidationError, type BackupData } from "./export";
import { createFlight, getFlight, listFlights } from "./repositories/flightRepository";
import { createBattery, listBatteries } from "./repositories/batteryRepository";
import { createPlace, listPlaces } from "./repositories/placeRepository";
import { loadSetting } from "./repositories/settingsRepository";
import type { FlightRecord, BatteryRecord } from "../domain/logbook/types";

async function wipeDatabase(): Promise<void> {
  const db = getDB();
  await db.flights.clear();
  await db.batteries.clear();
  await db.places.clear();
  await db.settings.clear();
}

beforeEach(async () => {
  resetDB();
  await wipeDatabase();
});

describe("export → import → equivalence", () => {
  it("round-trips flights, batteries and places with identical values", async () => {
    const flight = await createFlight({
      startedAt: "2026-09-01T10:00:00Z",
      coordinate: { latitude: -33.45, longitude: -70.65 },
      notes: "Vuelo de prueba",
      aircraftSnapshot: { id: "a1", name: "Mini 4 Pro" },
    });
    const battery = await createBattery({ name: "Bat 01", cycleCount: 3 });
    const place = await createPlace({ name: "Club Aéreo", coordinate: { latitude: -29.9, longitude: -71.25 } });

    const backup = await exportBackup("0.7.0");
    expect(backup.flights).toHaveLength(1);
    expect(backup.batteries).toHaveLength(1);
    expect(backup.places).toHaveLength(1);

    await wipeDatabase();

    const summary = await importBackup(backup);
    expect(summary.flights).toBe(1);
    expect(summary.batteries).toBe(1);
    expect(summary.places).toBe(1);

    const restoredFlights = await listFlights(10);
    expect(restoredFlights[0]).toMatchObject({
      id: flight.id,
      notes: "Vuelo de prueba",
      coordinate: { latitude: -33.45, longitude: -70.65 },
    });
    const restoredBatteries = await listBatteries();
    expect(restoredBatteries[0]).toMatchObject({ id: battery.id, name: "Bat 01", cycleCount: 3 });
    const restoredPlaces = await listPlaces();
    expect(restoredPlaces[0]).toMatchObject({ id: place.id, name: "Club Aéreo" });
  });

  it("restores compatible settings (flightLimits, activeAircraft, lastCoordinate)", async () => {
    const db = getDB();
    await db.settings.put({
      id: "flightLimits",
      value: JSON.stringify({ windMaxKmh: 30, gustMaxKmh: 40 }),
      updatedAt: "2026-09-01T00:00:00Z",
    });
    await db.settings.put({
      id: "activeAircraft",
      value: JSON.stringify({ id: "a1", name: "Mini 4 Pro", type: "MULTIROTOR" }),
      updatedAt: "2026-09-01T00:00:00Z",
    });
    await db.settings.put({
      id: "lastCoordinate",
      value: JSON.stringify({ latitude: -33.45, longitude: -70.66 }),
      updatedAt: "2026-09-01T00:00:00Z",
    });
    await db.settings.put({
      id: "ephemeralEphemeral",
      value: JSON.stringify({ nota: "no se debe restaurar" }),
      updatedAt: "2026-09-01T00:00:00Z",
    });

    const backup = await exportBackup("0.7.0");
    expect(Object.keys(backup.settings).sort()).toEqual(["activeAircraft", "ephemeralEphemeral", "flightLimits", "lastCoordinate"]);

    await wipeDatabase();

    const summary = await importBackup(backup);
    expect(summary.settings).toBe(3);

    const limits = await loadSetting<{ windMaxKmh: number }>("flightLimits");
    expect(limits?.windMaxKmh).toBe(30);
    const aircraft = await loadSetting<{ id: string }>("activeAircraft");
    expect(aircraft?.id).toBe("a1");
    const coord = await loadSetting<{ latitude: number }>("lastCoordinate");
    expect(coord?.latitude).toBe(-33.45);
    const ephemeral = await loadSetting("ephemeralEphemeral");
    expect(ephemeral).toBeNull();
  });

  it("import leaves database unchanged when backup is invalid", async () => {
    const flight = await createFlight({ startedAt: new Date().toISOString(), coordinate: { latitude: -33, longitude: -70 } });
    const invalid = {
      format: "vantops-backup",
      version: 2,
      flights: [],
      batteries: [],
    };
    const inspection = inspectBackup(invalid);
    expect(inspection.ok).toBe(false);
    await expect(importBackup(invalid as never)).rejects.toThrow(BackupValidationError);
    expect(await getFlight(flight.id)).toBeDefined();
  });

  it("rejects version incompatible clearly (no partial import)", async () => {
    const db = getDB();
    await db.settings.put({ id: "flightLimits", value: "{}", updatedAt: "2026-01-01T00:00:00Z" });
    const incompatible = {
      format: "vantops-backup",
      version: 99,
      exportedAt: new Date().toISOString(),
      appVersion: "99.0.0",
      flights: [],
      batteries: [],
    };
    await expect(importBackup(incompatible as never)).rejects.toThrow(/no compatible/);
    const after = await listFlights(10);
    expect(after).toHaveLength(0);
    const limits = await loadSetting("flightLimits");
    expect(limits).toEqual({});
  });

  it("rejects corrupt records and does not partially apply", async () => {
    const corrupt = {
      format: "vantops-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "0.7.0",
      flights: [
        {
          id: "bad",
          startedAt: "2026-09-01T10:00:00Z",
          coordinate: { latitude: -33.45, longitude: -70.65 },
          createdAt: "2026-09-01T10:00:00Z",
          updatedAt: "2026-09-01T10:00:00Z",
        },
        {
          id: "broken",
          startedAt: "2026-09-01T10:00:00Z",
          coordinate: { latitude: 999, longitude: -70.65 },
          createdAt: "2026-09-01T10:00:00Z",
          updatedAt: "2026-09-01T10:00:00Z",
        },
      ],
      batteries: [],
      places: [],
      settings: {},
    };
    const inspection = inspectBackup(corrupt);
    expect(inspection.ok).toBe(false);
    await expect(importBackup(corrupt as never)).rejects.toThrow(BackupValidationError);
    expect(await listFlights(10)).toHaveLength(0);
  });

  it("backward compatible: import backup without places or settings", async () => {
    const flight = await createFlight({ startedAt: "2026-09-01T10:00:00Z", coordinate: { latitude: -33, longitude: -70 } });
    const battery = await createBattery({ name: "Loop 1", cycleCount: 1 });
    const oldBackup = {
      format: "vantops-backup",
      version: 1,
      exportedAt: "2026-08-27T00:00:00Z",
      appVersion: "0.5.0",
      flights: [flight as FlightRecord],
      batteries: [battery as BatteryRecord],
    };
    await wipeDatabase();
    const summary = await importBackup(oldBackup as unknown as BackupData);
    expect(summary.flights).toBe(1);
    expect(summary.batteries).toBe(1);
    expect(summary.places).toBe(0);
    expect(summary.settings).toBe(0);
  });

  it("resolves ID conflicts keeping the most recently updated record", async () => {
    const base: FlightRecord = {
      id: "flight-same-id",
      startedAt: "2026-09-01T10:00:00Z",
      coordinate: { latitude: -33, longitude: -70 },
      createdAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-01T10:00:00Z",
    };
    await getDB().flights.put({ ...base, notes: "versión local v1" });
    const backup: BackupData = {
      format: "vantops-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "0.7.0",
      flights: [
        { ...base, notes: "versión backup más reciente", updatedAt: "2026-09-02T10:00:00Z" },
      ],
      batteries: [],
      places: [],
      settings: {},
    };
    const inspection = inspectBackup(backup);
    expect(inspection.ok).toBe(true);
    const summary = await importBackup(backup);
    expect(summary.flights).toBe(1);
    const restored = await getFlight("flight-same-id");
    expect(restored?.notes).toBe("versión backup más reciente");
  });

  it("keeps local record when backup record is older (no downgrade)", async () => {
    await getDB().flights.put({
      id: "latest",
      startedAt: "2026-09-01T10:00:00Z",
      coordinate: { latitude: -33, longitude: -70 },
      notes: "local más reciente",
      createdAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-05T10:00:00Z",
    });
    const backup: BackupData = {
      format: "vantops-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "0.7.0",
      flights: [
        {
          id: "latest",
          startedAt: "2026-09-01T10:00:00Z",
          coordinate: { latitude: -33, longitude: -70 },
          notes: "backup más antiguo",
          createdAt: "2026-09-01T10:00:00Z",
          updatedAt: "2026-09-01T10:00:00Z",
        },
      ],
      batteries: [],
      places: [],
      settings: {},
    };
    const summary = await importBackup(backup);
    expect(summary.flights).toBe(0);
    const restored = await getFlight("latest");
    expect(restored?.notes).toBe("local más reciente");
  });
});
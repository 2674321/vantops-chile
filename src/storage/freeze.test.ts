import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import Dexie, { type Table } from "dexie";

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

import { getDB, resetDB, VantOpsDB } from "./db";
import { exportBackup, CURRENT_BACKUP_VERSION, BACKUP_FORMAT } from "./export";
import {
  createFlight,
  listFlights,
  getFlight,
} from "./repositories/flightRepository";
import { createBattery, listBatteries } from "./repositories/batteryRepository";
import { createPlace, listPlaces } from "./repositories/placeRepository";
import {
  loadSetting,
  saveSetting,
  listSettings,
  removeSetting,
} from "./repositories/settingsRepository";
import type { FlightRecord } from "../domain/logbook/types";

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

describe("freeze: schema Dexie v2 (compatibilidad absoluta con 1.0.0)", () => {
  it("opens at database schema version 2 with the exact table schema", async () => {
    const db = getDB();
    expect(db.verno).toBe(2);
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ["batteries", "flights", "places", "settings"].sort()
    );
    const flightsSchema = db.table("flights").schema;
    const settingsSchema = db.table("settings").schema;
    expect(flightsSchema.primKey.name).toBe("id");
    expect(flightsSchema.indexes.map((i) => i.name).sort()).toEqual(
      ["aircraftId", "batteryId", "createdAt", "startedAt"].sort()
    );
    expect(settingsSchema.primKey.name).toBe("id");
  });

  it("upgrades an existing v1 database to v2 preserving flights and batteries", async () => {
    const legacy = new Dexie("vantops");
    legacy.version(1).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId",
      batteries: "id, name, createdAt",
    });
    const legacyFlights = legacy.table<FlightRecord, string>("flights");
    const legacyBatteries = legacy.table("batteries");
    await legacy.open();
    await legacyFlights.put({
      id: "legacy-flight",
      startedAt: "2026-08-01T10:00:00Z",
      coordinate: { latitude: -33.45, longitude: -70.66 },
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-01T10:00:00Z",
    });
    await legacyBatteries.put({
      id: "legacy-battery",
      name: "Pack v1",
      cycleCount: 4,
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-01T10:00:00Z",
    });
    legacy.close();

    resetDB();
    const db = getDB();
    expect(db.verno).toBe(2);
    expect(await db.flights.get("legacy-flight")).toMatchObject({ id: "legacy-flight" });
    expect(await listBatteries()).toHaveLength(1);
    await createPlace({ name: "Nuevo en v2", coordinate: { latitude: -33, longitude: -70 } });
    expect(await listPlaces()).toHaveLength(1);
  });
});

describe("freeze: formato de backup v1 sin cambios", () => {
  it("exports CURRENT_BACKUP_VERSION=1 and BACKUP_FORMAT without drift", () => {
    expect(CURRENT_BACKUP_VERSION).toBe(1);
    expect(BACKUP_FORMAT).toBe("vantops-backup");
  });

  it("export keeps the version/format contract on representative rows", async () => {
    await createFlight({
      startedAt: "2026-09-01T10:00:00Z",
      coordinate: { latitude: -33.45, longitude: -70.65 },
    });
    await createBattery({ name: "B", cycleCount: 0 });
    await createPlace({ name: "P", coordinate: { latitude: -29.9, longitude: -71.25 } });
    await saveSetting("operationZoneRadius", 800);

    const backup = await exportBackup("1.0.1");
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.version).toBe(CURRENT_BACKUP_VERSION);
    expect(Array.isArray(backup.flights)).toBe(true);
    expect(Array.isArray(backup.batteries)).toBe(true);
    expect(Array.isArray(backup.places)).toBe(true);
    expect(backup.settings).toMatchObject({ operationZoneRadius: 800 });
  });

  it("settings survive a save/load cycle unchanged (JSON no transform)", async () => {
    const limits = { windMaxKmh: 25, gustMaxKmh: 35, noDroneZoneKm: 1.5 };
    await saveSetting("flightLimits", limits);
    expect(await loadSetting<typeof limits>("flightLimits")).toEqual(limits);
  });
});

describe("freeze: fallos de storage no rompen la app)", () => {
  it("returns null for a corrupted settings value instead of crashing", async () => {
    await getDB().settings.put({
      id: "corrupted",
      value: "{not-json",
      updatedAt: "2026-09-01T00:00:00Z",
    });
    expect(await loadSetting("corrupted")).toBeNull();
  });

  it("listSettings falls back to raw value for corrupted entries", async () => {
    await getDB().settings.put({
      id: "ok",
      value: '{"a":1}',
      updatedAt: "2026-09-01T00:00:00Z",
    });
    await getDB().settings.put({
      id: "rotten",
      value: "nope",
      updatedAt: "2026-09-01T00:00:00Z",
    });
    const all = await listSettings();
    expect(all.ok).toEqual({ a: 1 });
    expect(all.rotten).toBe("nope");
  });

  it("reading an empty database returns empty lists, not undefined or throws", async () => {
    expect(await listFlights(10)).toEqual([]);
    expect(await listBatteries()).toEqual([]);
    expect(await listPlaces()).toEqual([]);
    expect(await loadSetting("anything")).toBeNull();
    expect(await getFlight("missing")).toBeUndefined();
  });

  it("removes a setting without error", async () => {
    await saveSetting("operationZoneRadius", 500);
    await removeSetting("operationZoneRadius");
    expect(await loadSetting("operationZoneRadius")).toBeNull();
  });
});

describe("freeze: tabelas expuestas en la clase db", () => {
  it("VantOpsDB expone las 4 tabelas tipadas", () => {
    const db = new VantOpsDB();
    try {
      const names = [db.flights, db.batteries, db.places, db.settings].map(
        (t) => (t as unknown as Table<unknown, string>).name
      );
      expect(names.sort()).toEqual(["batteries", "flights", "places", "settings"]);
    } finally {
      db.close();
    }
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadFlightLimits,
  saveFlightLimits,
  loadActiveAircraft,
  saveActiveAircraft,
  loadSelectedManufacturer,
  saveSelectedManufacturer,
  loadSelectedModel,
  saveSelectedModel,
  clearAircraftSelection,
  loadOperationRadius,
  saveOperationRadius,
} from "./settings";
import type { FlightLimits } from "../domain/assessment/limits";
import type { AircraftProfile } from "../domain/assessment/aircraft";

const { idbStore, deleteMock } = vi.hoisted(() => ({
  idbStore: new Map<string, string>(),
  deleteMock: vi.fn(),
}));

vi.mock("./db", () => ({
  getDB: () => ({
    settings: {
      get: vi.fn(async (key: string) => {
        const value = idbStore.get(key);
        return value === undefined ? undefined : { id: key, value, updatedAt: "" };
      }),
      put: vi.fn(async (record: { id: string; value: string }) => {
        idbStore.set(record.id, record.value);
      }),
      delete: vi.fn(async (key: string) => {
        idbStore.delete(key);
        deleteMock(key);
      }),
      toArray: vi.fn(async () =>
        [...idbStore.entries()].map(([id, value]) => ({ id, value, updatedAt: "" })),
      ),
    },
  }),
}));

let store: Record<string, string>;

beforeEach(() => {
  store = {};
  idbStore.clear();
  deleteMock.mockClear();
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

describe("flight limits persistence", () => {
  it("returns empty object when nothing stored", async () => {
    const result = await loadFlightLimits();
    expect(result).toEqual({});
  });

  it("saves and loads limits from localStorage", async () => {
    const limits: FlightLimits = { windMaxKmh: 30, gustMaxKmh: 40 };
    store["vantops:flightLimits"] = JSON.stringify(limits);
    const result = await loadFlightLimits();
    expect(result).toEqual(limits);
  });

  it("handles corrupt data", async () => {
    store["vantops:flightLimits"] = "not-json";
    const result = await loadFlightLimits();
    expect(result).toEqual({});
  });

  it("saveFlightLimits persists and can be reloaded (recarga de configuración)", async () => {
    const limits: FlightLimits = {
      windMaxKmh: 35,
      gustMaxKmh: 45,
      precipitationMaxMm: 1,
      visibilityMinMeters: 4000,
      temperatureMinC: -5,
      temperatureMaxC: 40,
    };
    await saveFlightLimits(limits);
    const result = await loadFlightLimits();
    expect(result).toEqual(limits);
  });

  it("saving empty limits persists empty configuration", async () => {
    await saveFlightLimits({});
    const result = await loadFlightLimits();
    expect(result).toEqual({});
  });

  it("reloads limits across multiple save/load cycles", async () => {
    await saveFlightLimits({ windMaxKmh: 15 });
    expect((await loadFlightLimits()).windMaxKmh).toBe(15);
    await saveFlightLimits({ windMaxKmh: 50, gustMaxKmh: 60 });
    const result = await loadFlightLimits();
    expect(result.windMaxKmh).toBe(50);
    expect(result.gustMaxKmh).toBe(60);
    expect(result.precipitationMaxMm).toBeUndefined();
  });
});

describe("aircraft profile persistence", () => {
  it("returns null when nothing stored", async () => {
    const result = await loadActiveAircraft();
    expect(result).toBeNull();
  });

  it("saves and loads aircraft from localStorage", async () => {
    const aircraft: AircraftProfile = {
      id: "dji-mini",
      name: "DJI Mini 4 Pro",
      type: "MULTIROTOR",
      manufacturer: "DJI",
      model: "Mini 4 Pro",
    };
    store["vantops:activeAircraft"] = JSON.stringify(aircraft);
    const result = await loadActiveAircraft();
    expect(result).not.toBeNull();
    expect(result?.id).toBe("dji-mini");
    expect(result?.name).toBe("DJI Mini 4 Pro");
    expect(result?.type).toBe("MULTIROTOR");
  });

  it("rejects invalid shape", async () => {
    store["vantops:activeAircraft"] = JSON.stringify({ foo: "bar" });
    const result = await loadActiveAircraft();
    expect(result).toBeNull();
  });

  it("handles corrupt data", async () => {
    store["vantops:activeAircraft"] = "not-json";
    const result = await loadActiveAircraft();
    expect(result).toBeNull();
  });
});

describe("manufacturer/model persistence", () => {
  it("returns null when nothing stored", () => {
    expect(loadSelectedManufacturer()).toBeNull();
    expect(loadSelectedModel()).toBeNull();
  });

  it("saves and loads manufacturer", () => {
    saveSelectedManufacturer("dji");
    expect(loadSelectedManufacturer()).toBe("dji");
  });

  it("saves and loads model", () => {
    saveSelectedModel("dji-mini-4-pro");
    expect(loadSelectedModel()).toBe("dji-mini-4-pro");
  });

  it("clearAircraftSelection removes all keys including IndexedDB", async () => {
    saveSelectedManufacturer("dji");
    saveSelectedModel("dji-mini-4-pro");
    store["vantops:activeAircraft"] = JSON.stringify({ id: "test", name: "Test" });
    await saveActiveAircraft({
      id: "test",
      name: "Test",
      type: "MULTIROTOR",
      manufacturer: "DJI",
      model: "Mini",
    });

    await clearAircraftSelection();

    expect(loadSelectedManufacturer()).toBeNull();
    expect(loadSelectedModel()).toBeNull();
    expect(deleteMock).toHaveBeenCalledWith("activeAircraft");
    const result = await loadActiveAircraft();
    expect(result).toBeNull();
  });
});

describe("operation radius persistence", () => {
  it("returns null when nothing stored", async () => {
    expect(await loadOperationRadius()).toBeNull();
  });

  it("saves and reloads a valid radius", async () => {
    await saveOperationRadius(1000);
    expect(await loadOperationRadius()).toBe(1000);
  });

  it("loads a radius previously mirrored in localStorage", async () => {
    store["vantops:operationZoneRadius"] = JSON.stringify(2000);
    expect(await loadOperationRadius()).toBe(2000);
  });

  it("ignores invalid persisted radii", async () => {
    store["vantops:operationZoneRadius"] = JSON.stringify(0);
    expect(await loadOperationRadius()).toBeNull();
    store["vantops:operationZoneRadius"] = JSON.stringify(-5);
    expect(await loadOperationRadius()).toBeNull();
    store["vantops:operationZoneRadius"] = JSON.stringify(999999);
    expect(await loadOperationRadius()).toBeNull();
    store["vantops:operationZoneRadius"] = "not-json";
    expect(await loadOperationRadius()).toBeNull();
  });

  it("rejects saving an invalid radius", async () => {
    await expect(saveOperationRadius(0)).rejects.toThrow(/mayor que cero/);
    await expect(saveOperationRadius(-100)).rejects.toThrow();
  });
});

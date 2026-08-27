import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadFlightLimits,
  loadActiveAircraft,
  loadSelectedManufacturer,
  saveSelectedManufacturer,
  loadSelectedModel,
  saveSelectedModel,
  clearAircraftSelection,
} from "./settings";
import type { FlightLimits } from "../domain/assessment/limits";
import type { AircraftProfile } from "../domain/assessment/aircraft";

vi.mock("./db", () => ({
  getDB: () => ({
    settings: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
    },
  }),
}));

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

  it("clearAircraftSelection removes all keys", async () => {
    saveSelectedManufacturer("dji");
    saveSelectedModel("dji-mini-4-pro");
    store["vantops:activeAircraft"] = JSON.stringify({ id: "test", name: "Test" });
    clearAircraftSelection();
    expect(loadSelectedManufacturer()).toBeNull();
    expect(loadSelectedModel()).toBeNull();
    const result = await loadActiveAircraft();
    expect(result).toBeNull();
  });
});

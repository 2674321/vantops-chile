import { describe, it, expect } from "vitest";
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
} from "./settings";
import type { FlightLimits } from "../domain/assessment/limits";
import type { AircraftProfile } from "../domain/assessment/aircraft";

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

import { vi, beforeEach } from "vitest";

describe("flight limits persistence", () => {
  it("returns empty object when nothing stored", () => {
    expect(loadFlightLimits()).toEqual({});
  });

  it("saves and loads limits", () => {
    const limits: FlightLimits = { windMaxKmh: 30, gustMaxKmh: 40 };
    saveFlightLimits(limits);
    const loaded = loadFlightLimits();
    expect(loaded.windMaxKmh).toBe(30);
    expect(loaded.gustMaxKmh).toBe(40);
  });

  it("handles corrupt data", () => {
    store["vantops:flightLimits"] = "not-json";
    expect(loadFlightLimits()).toEqual({});
  });

  it("overwrites previous limits", () => {
    saveFlightLimits({ windMaxKmh: 30 });
    saveFlightLimits({ windMaxKmh: 50 });
    expect(loadFlightLimits().windMaxKmh).toBe(50);
  });
});

describe("aircraft profile persistence", () => {
  it("returns null when nothing stored", () => {
    expect(loadActiveAircraft()).toBeNull();
  });

  it("saves and loads aircraft", () => {
    const aircraft: AircraftProfile = {
      id: "dji-mini",
      name: "DJI Mini 4 Pro",
      type: "MULTIROTOR",
      manufacturer: "DJI",
      model: "Mini 4 Pro",
    };
    saveActiveAircraft(aircraft);
    const loaded = loadActiveAircraft();
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe("dji-mini");
    expect(loaded!.name).toBe("DJI Mini 4 Pro");
    expect(loaded!.type).toBe("MULTIROTOR");
  });

  it("rejects invalid shape", () => {
    store["vantops:activeAircraft"] = JSON.stringify({ foo: "bar" });
    expect(loadActiveAircraft()).toBeNull();
  });

  it("handles corrupt data", () => {
    store["vantops:activeAircraft"] = "not-json";
    expect(loadActiveAircraft()).toBeNull();
  });

  it("does not affect limits when saving aircraft", () => {
    saveFlightLimits({ windMaxKmh: 30 });
    saveActiveAircraft({ id: "test", name: "Test" });
    expect(loadFlightLimits().windMaxKmh).toBe(30);
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

  it("clearAircraftSelection removes all keys", () => {
    saveSelectedManufacturer("dji");
    saveSelectedModel("dji-mini-4-pro");
    saveActiveAircraft({ id: "test", name: "Test" });
    clearAircraftSelection();
    expect(loadSelectedManufacturer()).toBeNull();
    expect(loadSelectedModel()).toBeNull();
    expect(loadActiveAircraft()).toBeNull();
  });
});

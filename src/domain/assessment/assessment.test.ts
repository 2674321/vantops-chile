import { describe, it, expect } from "vitest";
import { evaluateFlight } from "./evaluator";
import {
  AIRCRAFT_CATALOG,
  AIRCRAFT_TYPE_LABELS,
  findManufacturer,
  findModel,
  createAircraftProfile,
  applyAircraftLimits,
} from "./aircraft";
import type { FlightAssessmentInput } from "./types";

const base: FlightAssessmentInput = {
  windSpeedKmh: 10,
  gustKmh: 15,
  windSpeed100mKmh: 20,
  windDirectionDeg: 270,
  temperatureC: 15,
  precipitationMm: 0,
  visibilityM: 8000,
  humidityPct: 70,
  cloudCoverPct: 50,
};

describe("evaluateFlight", () => {
  it("returns NO_DATA when no limits configured", () => {
    const result = evaluateFlight(base);
    expect(result.status).toBe("NO_DATA");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns FAVORABLE when all under limits", () => {
    const result = evaluateFlight({
      ...base,
      windMaxKmh: 30,
      gustMaxKmh: 40,
      precipitationMaxMm: 2,
      visibilityMinMeters: 5000,
      temperatureMinC: 5,
      temperatureMaxC: 35,
    });
    expect(result.status).toBe("FAVORABLE");
    expect(result.reasons.every((r) => r.severity === "info")).toBe(true);
  });

  it("returns CAUTION when near limit", () => {
    const result = evaluateFlight({
      ...base,
      windMaxKmh: 12,
    });
    expect(result.status).toBe("CAUTION");
    expect(result.reasons.some((r) => r.code === "WIND_NEAR_LIMIT")).toBe(true);
  });

  it("returns UNFAVORABLE when wind exceeds", () => {
    const result = evaluateFlight({
      ...base,
      windMaxKmh: 8,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "WIND_EXCEEDED")).toBe(true);
  });

  it("returns UNFAVORABLE when gust exceeds", () => {
    const result = evaluateFlight({
      ...base,
      gustMaxKmh: 10,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "GUST_EXCEEDED")).toBe(true);
  });

  it("returns UNFAVORABLE when precipitation exceeds", () => {
    const result = evaluateFlight({
      ...base,
      precipitationMm: 5,
      precipitationMaxMm: 0.1,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "PRECIP_EXCEEDED")).toBe(true);
  });

  it("returns UNFAVORABLE when visibility below minimum", () => {
    const result = evaluateFlight({
      ...base,
      visibilityM: 3000,
      visibilityMinMeters: 5000,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "VIS_BELOW_MIN")).toBe(true);
  });

  it("returns UNFAVORABLE when temperature below minimum", () => {
    const result = evaluateFlight({
      ...base,
      temperatureC: 2,
      temperatureMinC: 5,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "TEMP_BELOW_MIN")).toBe(true);
  });

  it("returns UNFAVORABLE when temperature above maximum", () => {
    const result = evaluateFlight({
      ...base,
      temperatureC: 40,
      temperatureMaxC: 35,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "TEMP_ABOVE_MAX")).toBe(true);
  });

  it("handles null wind data with limits", () => {
    const result = evaluateFlight({
      ...base,
      windSpeedKmh: null,
      windMaxKmh: 30,
    });
    expect(result.status).toBe("CAUTION");
    expect(result.reasons.some((r) => r.code === "WIND_MISSING")).toBe(true);
  });

  it("handles null visibility data with limits", () => {
    const result = evaluateFlight({
      ...base,
      visibilityM: null,
      visibilityMinMeters: 5000,
    });
    expect(result.status).toBe("CAUTION");
    expect(result.reasons.some((r) => r.code === "VIS_MISSING")).toBe(true);
  });

  it("always includes wind 100m info", () => {
    const result = evaluateFlight(base);
    expect(result.reasons.some((r) => r.code === "WIND100M_INFO")).toBe(true);
  });

  it("populates evaluatedAt", () => {
    const result = evaluateFlight(base);
    expect(result.evaluatedAt).toBeTruthy();
    expect(new Date(result.evaluatedAt).getTime()).not.toBeNaN();
  });

  it("populates missingData when relevant", () => {
    const result = evaluateFlight({
      windSpeedKmh: null,
      gustKmh: null,
      windSpeed100mKmh: null,
      windDirectionDeg: null,
      temperatureC: null,
      precipitationMm: null,
      visibilityM: null,
      humidityPct: null,
      cloudCoverPct: null,
    });
    expect(result.missingData.length).toBeGreaterThanOrEqual(4);
  });
});

describe("AIRCRAFT_CATALOG", () => {
  it("has manufacturers", () => {
    expect(AIRCRAFT_CATALOG.length).toBeGreaterThan(0);
  });

  it("includes DJI", () => {
    const dji = findManufacturer("dji");
    expect(dji).toBeDefined();
    expect(dji?.name).toBe("DJI");
    expect(dji?.models.length).toBeGreaterThan(0);
  });

  it("includes generic manufacturer", () => {
    const generic = findManufacturer("generic");
    expect(generic).toBeDefined();
    expect(generic?.models.length).toBeGreaterThanOrEqual(4);
  });

  it("findModel finds a model by id", () => {
    const model = findModel("dji-mini-4-pro");
    expect(model).toBeDefined();
    expect(model?.name).toBe("Mini 4 Pro");
    expect(model?.type).toBe("MULTIROTOR");
  });

  it("findModel returns undefined for unknown id", () => {
    expect(findModel("nonexistent")).toBeUndefined();
  });

  it("findManufacturer returns undefined for unknown id", () => {
    expect(findManufacturer("nonexistent")).toBeUndefined();
  });
});

describe("createAircraftProfile", () => {
  it("creates profile from catalog", () => {
    const profile = createAircraftProfile("dji", "dji-mini-4-pro");
    expect(profile.id).toBe("dji-mini-4-pro");
    expect(profile.name).toBe("Mini 4 Pro");
    expect(profile.type).toBe("MULTIROTOR");
    expect(profile.manufacturer).toBe("DJI");
    expect(profile.model).toBe("Mini 4 Pro");
  });

  it("creates generic profile", () => {
    const profile = createAircraftProfile("generic", "generic-multicopter");
    expect(profile.id).toBe("generic-multicopter");
    expect(profile.type).toBe("MULTIROTOR");
    expect(profile.manufacturer).toBe("Genérico");
  });

  it("uses custom name when provided", () => {
    const profile = createAircraftProfile("dji", "dji-mini-4-pro", "Mi drone");
    expect(profile.name).toBe("Mi drone");
  });
});

describe("applyAircraftLimits", () => {
  it("returns base when no aircraft", () => {
    const base = { windMaxKmh: 20 };
    expect(applyAircraftLimits(base)).toEqual(base);
  });

  it("merges aircraft wind limits into base", () => {
    const base = {};
    const aircraft = { id: "test", name: "Test", windMaxKmh: 25, gustMaxKmh: 35 };
    const result = applyAircraftLimits(base, aircraft);
    expect(result.windMaxKmh).toBe(25);
    expect(result.gustMaxKmh).toBe(35);
  });

  it("base limits take precedence over aircraft limits", () => {
    const base = { windMaxKmh: 15 };
    const aircraft = { id: "test", name: "Test", windMaxKmh: 25 };
    const result = applyAircraftLimits(base, aircraft);
    expect(result.windMaxKmh).toBe(15);
  });
});

describe("AIRCRAFT_TYPE_LABELS", () => {
  it("has labels for all types", () => {
    expect(AIRCRAFT_TYPE_LABELS.MULTIROTOR).toBeTruthy();
    expect(AIRCRAFT_TYPE_LABELS.FIXED_WING).toBeTruthy();
    expect(AIRCRAFT_TYPE_LABELS.VTOL).toBeTruthy();
    expect(AIRCRAFT_TYPE_LABELS.HELICOPTER).toBeTruthy();
    expect(AIRCRAFT_TYPE_LABELS.OTHER).toBeTruthy();
  });
});

import { describe, it, expect } from "vitest";
import { evaluateFlight } from "./evaluator";
import {
  AIRCRAFT_CATALOG,
  AIRCRAFT_TYPE_LABELS,
  findManufacturer,
  findModel,
  createAircraftProfile,
  applyAircraftLimits,
  searchAircraftCatalog,
} from "./aircraft";
import type { FlightAssessmentInput } from "./types";
import type { FlightLimits } from "./limits";

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

  it("never returns FAVORABLE when a configured gust limit has no gust data", () => {
    const result = evaluateFlight({ ...base, gustKmh: null, gustMaxKmh: 40 });
    expect(result.status).toBe("CAUTION");
    expect(result.isComplete).toBe(false);
    expect(result.blockingMissingData).toContain("ráfagas");
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ code: "GUST_MISSING", severity: "warning" })
    );
  });

  it.each(["temperatureMinC", "temperatureMaxC"] as const)(
    "never returns FAVORABLE when %s is configured without temperature data",
    (limit) => {
      const result = evaluateFlight({
        ...base,
        temperatureC: null,
        [limit]: limit === "temperatureMinC" ? 0 : 35,
      });
      expect(result.status).toBe("CAUTION");
      expect(result.isComplete).toBe(false);
      expect(result.blockingMissingData).toContain("temperatura");
      expect(result.reasons.some((reason) => reason.code === "TEMP_MISSING")).toBe(true);
    }
  );

  it("accepts zero as a valid precipitation value and limit", () => {
    const result = evaluateFlight({ ...base, precipitationMm: 0, precipitationMaxMm: 0 });
    expect(result.status).toBe("FAVORABLE");
    expect(result.blockingMissingData).not.toContain("precipitación");
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    "treats invalid required numeric data (%s) as incomplete",
    (invalid) => {
      const result = evaluateFlight({ ...base, windSpeedKmh: invalid, windMaxKmh: 30 });
      expect(result.status).not.toBe("FAVORABLE");
      expect(result.isComplete).toBe(false);
      expect(result.blockingMissingData).toContain("viento de referencia");
    }
  );

  it.each([Number.NaN, Number.NEGATIVE_INFINITY])(
    "rejects an invalid configured limit (%s) instead of passing implicitly",
    (invalid) => {
      const result = evaluateFlight({ ...base, windMaxKmh: invalid });
      expect(result.status).toBe("CAUTION");
      expect(result.isComplete).toBe(false);
      expect(result.blockingMissingData).toContain("configuración de límites válida");
      expect(result.reasons.some((reason) => reason.code === "WIND_LIMIT_INVALID")).toBe(true);
    }
  );

  it("does not present stale provider data as a current favorable assessment", () => {
    const result = evaluateFlight({ ...base, windMaxKmh: 30, sourceStatus: "stale" });
    expect(result.status).toBe("CAUTION");
    expect(result.isComplete).toBe(false);
    expect(result.blockingMissingData).toContain("vigencia de la fuente");
    expect(result.reasons.some((reason) => reason.code === "SOURCE_STALE")).toBe(true);
  });

  it("keeps an exceeded criterion UNFAVORABLE while exposing incompleteness", () => {
    const result = evaluateFlight({
      ...base,
      visibilityM: 1000,
      visibilityMinMeters: 5000,
      gustKmh: null,
      gustMaxKmh: 40,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.isComplete).toBe(false);
    expect(result.blockingMissingData).toContain("ráfagas");
  });

  it("does not penalize missing variables with no active criterion", () => {
    const result = evaluateFlight({
      ...base,
      humidityPct: null,
      cloudCoverPct: null,
      gustKmh: null,
      windMaxKmh: 30,
    });
    expect(result.status).toBe("FAVORABLE");
    expect(result.isComplete).toBe(true);
    expect(result.informationalMissingData).toContain("ráfagas");
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

  it("searches models without case or accents and by aircraft type", () => {
    expect(searchAircraftCatalog("mavic 3").some(({ model }) => model.id === "dji-mavic-3-pro")).toBe(true);
    expect(searchAircraftCatalog("ala fija").some(({ model }) => model.id === "sensefly-ebee-x")).toBe(true);
    expect(searchAircraftCatalog("WINGTRA").some(({ model }) => model.id === "wingtra-ray")).toBe(true);
  });

  it("exposes an expanded curated catalog", () => {
    expect(AIRCRAFT_CATALOG.flatMap((manufacturer) => manufacturer.models).length).toBeGreaterThanOrEqual(60);
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

describe("evaluateFlight boundary conditions (límites exactos/frontera)", () => {
  it("wind exactly at max is not exceeded (just below the critical threshold)", () => {
    const result = evaluateFlight({ ...base, windSpeedKmh: 30, windMaxKmh: 30 });
    expect(result.status).not.toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "WIND_EXCEEDED")).toBe(false);
    expect(result.reasons.some((r) => r.code === "WIND_NEAR_LIMIT")).toBe(true);
  });

  it("wind one unit above max is exceeded", () => {
    const result = evaluateFlight({ ...base, windSpeedKmh: 31, windMaxKmh: 30 });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "WIND_EXCEEDED")).toBe(true);
  });

  it("gust exactly at max is not exceeded (just below the critical threshold)", () => {
    const result = evaluateFlight({ ...base, gustKmh: 40, gustMaxKmh: 40 });
    expect(result.status).not.toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "GUST_EXCEEDED")).toBe(false);
    expect(result.reasons.some((r) => r.code === "GUST_NEAR_LIMIT")).toBe(true);
  });

  it("visibility exactly at minimum passes", () => {
    const result = evaluateFlight({ ...base, visibilityM: 5000, visibilityMinMeters: 5000 });
    expect(result.status).toBe("FAVORABLE");
    expect(result.reasons.some((r) => r.code === "VIS_BELOW_MIN")).toBe(false);
  });

  it("temperature exactly at min passes", () => {
    const result = evaluateFlight({ ...base, temperatureC: 5, temperatureMinC: 5 });
    expect(result.status).toBe("FAVORABLE");
    expect(result.reasons.some((r) => r.code === "TEMP_BELOW_MIN")).toBe(false);
  });

  it("precipitation exactly at max passes", () => {
    const result = evaluateFlight({ ...base, precipitationMm: 2, precipitationMaxMm: 2 });
    expect(result.status).toBe("FAVORABLE");
    expect(result.reasons.some((r) => r.code === "PRECIP_EXCEEDED")).toBe(false);
  });
});

describe("combining pilot limits with aircraft limits", () => {
  it("pilot limits take precedence over aircraft limits in assessment", () => {
    const pilotLimits: FlightLimits = { windMaxKmh: 20, gustMaxKmh: 25 };
    const aircraft = {
      id: "test",
      name: "Test",
      windMaxKmh: 40,
      gustMaxKmh: 50,
    };
    const limits = applyAircraftLimits(pilotLimits, aircraft);
    expect(limits.windMaxKmh).toBe(20);
    expect(limits.gustMaxKmh).toBe(25);

    const result = evaluateFlight({
      ...base,
      windSpeedKmh: 25,
      ...limits,
    });
    expect(result.status).toBe("UNFAVORABLE");
    expect(result.reasons.some((r) => r.code === "WIND_EXCEEDED")).toBe(true);
  });

  it("aircraft limits contribute when pilot has not configured that criterion", () => {
    const pilotLimits: FlightLimits = {};
    const aircraft = {
      id: "test",
      name: "Test",
      windMaxKmh: 30,
      gustMaxKmh: 40,
    };
    const limits = applyAircraftLimits(pilotLimits, aircraft);
    const result = evaluateFlight({ ...base, ...limits });
    expect(result.status).toBe("FAVORABLE");
    expect(result.reasons.some((r) => r.code === "WIND_OK")).toBe(true);
  });

  it("no limits anywhere means NO_DATA", () => {
    const limits = applyAircraftLimits({}, undefined);
    const result = evaluateFlight({ ...base, ...limits });
    expect(result.status).toBe("NO_DATA");
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

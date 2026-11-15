import { describe, expect, it } from "vitest";
import {
  haversineDistanceMeters,
  initialBearingDegrees,
  isValidSavedOperationalMap,
  parseStrictRadiusMeters,
  zoneMetrics,
} from "./operationalMap";

describe("operational map geometry", () => {
  it("parses only complete radius values", () => {
    expect(parseStrictRadiusMeters("500")).toBe(500);
    expect(parseStrictRadiusMeters("1500,5")).toBe(1500.5);
    for (const invalid of ["0", "-1", "abc", "500abc", "NaN", "Infinity", "", "49", "50001"]) {
      expect(parseStrictRadiusMeters(invalid)).toBeNull();
    }
  });

  it("calculates diameter, area and perimeter", () => {
    expect(zoneMetrics(500)).toEqual({
      diameterMeters: 1000,
      areaSquareMeters: Math.PI * 250000,
      perimeterMeters: Math.PI * 1000,
    });
  });

  it("calculates geodesic distance and bearing, including the antimeridian", () => {
    const santiago = { latitude: -33.45, longitude: -70.66 };
    const valparaiso = { latitude: -33.0472, longitude: -71.6127 };
    expect(haversineDistanceMeters(santiago, valparaiso)).toBeGreaterThan(90_000);
    expect(haversineDistanceMeters(santiago, valparaiso)).toBeLessThan(120_000);
    expect(initialBearingDegrees(santiago, valparaiso)).toBeGreaterThan(250);
    expect(haversineDistanceMeters({ latitude: 0, longitude: 179.9 }, { latitude: 0, longitude: -179.9 })).toBeLessThan(25_000);
  });

  it("validates ten independent zones and rejects duplicate IDs", () => {
    const now = new Date().toISOString();
    const zones = Array.from({ length: 10 }, (_, index) => ({
      id: `zone-${index}`,
      name: `Zona ${index}`,
      center: { latitude: -33.45 + index / 100, longitude: -70.66 },
      radiusMeters: 100 + index * 50,
      color: "#38bdf8",
      visible: true,
      fillOpacity: 0.12,
    }));
    const map = { id: "map-1", schemaVersion: 1, name: "QA", zones, createdAt: now, updatedAt: now };
    expect(isValidSavedOperationalMap(map)).toBe(true);
    expect(isValidSavedOperationalMap({ ...map, pins: [{ id: "pin-1", name: "Despegue", coordinate: zones[0].center, color: "#22c55e" }] })).toBe(true);
    expect(isValidSavedOperationalMap({ ...map, pins: [{ id: "pin-1", name: "", coordinate: zones[0].center, color: "#22c55e" }] })).toBe(false);
    expect(isValidSavedOperationalMap({ ...map, zones: [zones[0], zones[0]] })).toBe(false);
  });
});

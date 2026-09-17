import { describe, it, expect } from "vitest";
import {
  RADIUS_PRESETS_METERS,
  MIN_RADIUS_METERS,
  MAX_RADIUS_METERS,
  validateRadiusMeters,
  isValidRadiusMeters,
  createOperationZone,
  isValidOperationZone,
  formatRadius,
  OPERATION_ZONE_DISCLAIMER,
} from "./operationZone";

describe("radius presets and bounds", () => {
  it("exposes 500 m, 1 km and 2 km presets", () => {
    expect([...RADIUS_PRESETS_METERS]).toEqual([500, 1000, 2000]);
  });

  it("defines a technical minimum and maximum", () => {
    expect(MIN_RADIUS_METERS).toBeGreaterThan(0);
    expect(MAX_RADIUS_METERS).toBeGreaterThan(MIN_RADIUS_METERS);
  });

  it("does not describe the zone as authorized", () => {
    expect(OPERATION_ZONE_DISCLAIMER).toContain("no implica autorización");
    expect(OPERATION_ZONE_DISCLAIMER).toContain("planificación");
    expect(OPERATION_ZONE_DISCLAIMER.toLowerCase()).not.toContain("zona autorizada");
  });
});

describe("validateRadiusMeters", () => {
  it("accepts preset values", () => {
    for (const preset of RADIUS_PRESETS_METERS) {
      expect(validateRadiusMeters(preset).ok).toBe(true);
    }
  });

  it("accepts a custom positive value", () => {
    expect(validateRadiusMeters(3500).ok).toBe(true);
  });

  it("rejects zero", () => {
    const result = validateRadiusMeters(0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/mayor que cero/);
  });

  it("rejects negative values", () => {
    expect(validateRadiusMeters(-100).ok).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(validateRadiusMeters(Number.NaN).ok).toBe(false);
    expect(validateRadiusMeters(Number.POSITIVE_INFINITY).ok).toBe(false);
  });

  it("rejects non-number input", () => {
    expect(validateRadiusMeters("1000").ok).toBe(false);
    expect(validateRadiusMeters(null).ok).toBe(false);
    expect(validateRadiusMeters(undefined).ok).toBe(false);
  });

  it("rejects values above the technical maximum", () => {
    const result = validateRadiusMeters(MAX_RADIUS_METERS + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/máximo/);
  });

  it("rejects values below the technical minimum", () => {
    expect(validateRadiusMeters(MIN_RADIUS_METERS - 1).ok).toBe(false);
  });
});

describe("isValidRadiusMeters", () => {
  it("narrows valid numbers", () => {
    expect(isValidRadiusMeters(500)).toBe(true);
    expect(isValidRadiusMeters(0)).toBe(false);
  });
});

describe("createOperationZone", () => {
  const center = { latitude: -33.45, longitude: -70.66 };

  it("creates a zone with a valid center and radius", () => {
    const zone = createOperationZone(center, 1000);
    expect(zone.center).toEqual(center);
    expect(zone.radiusMeters).toBe(1000);
  });

  it("copies the center so it is not shared by reference", () => {
    const source = { latitude: -33.45, longitude: -70.66 };
    const zone = createOperationZone(source, 500);
    source.latitude = 0;
    expect(zone.center.latitude).toBe(-33.45);
  });

  it("throws on an invalid radius", () => {
    expect(() => createOperationZone(center, 0)).toThrow(/mayor que cero/);
    expect(() => createOperationZone(center, MAX_RADIUS_METERS + 1)).toThrow(/máximo/);
  });

  it("throws on an invalid center", () => {
    expect(() => createOperationZone({ latitude: 999, longitude: -70 }, 500)).toThrow();
  });
});

describe("isValidOperationZone", () => {
  it("accepts a well-formed zone", () => {
    expect(
      isValidOperationZone({ center: { latitude: -33.45, longitude: -70.66 }, radiusMeters: 2000 })
    ).toBe(true);
  });

  it("rejects malformed zones", () => {
    expect(isValidOperationZone(null)).toBe(false);
    expect(isValidOperationZone({})).toBe(false);
    expect(
      isValidOperationZone({ center: { latitude: 999, longitude: -70 }, radiusMeters: 500 })
    ).toBe(false);
    expect(
      isValidOperationZone({ center: { latitude: -33, longitude: -70 }, radiusMeters: -1 })
    ).toBe(false);
  });
});

describe("formatRadius", () => {
  it("formats meters below 1 km", () => {
    expect(formatRadius(500)).toBe("500 m");
  });

  it("formats kilometers with no decimals when integer", () => {
    expect(formatRadius(1000)).toBe("1 km");
    expect(formatRadius(2000)).toBe("2 km");
  });

  it("formats kilometers with one decimal when needed", () => {
    expect(formatRadius(3500)).toBe("3.5 km");
  });
});

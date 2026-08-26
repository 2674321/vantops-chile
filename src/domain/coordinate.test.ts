import { describe, it, expect } from "vitest";
import {
  isValidLatitude,
  isValidLongitude,
  isValidCoordinate,
  validateCoordinate,
  formatCoordinate,
  serializeCoordinate,
  deserializeCoordinate,
} from "./coordinate";
import type { Coordinate } from "./coordinate";

describe("isValidLatitude", () => {
  it("accepts valid negative latitudes", () => {
    expect(isValidLatitude(-33.45)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
  });
  it("accepts valid positive latitudes", () => {
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
  });
  it("rejects out of range", () => {
    expect(isValidLatitude(-91)).toBe(false);
    expect(isValidLatitude(91)).toBe(false);
  });
  it("rejects non-finite", () => {
    expect(isValidLatitude(Number.NaN)).toBe(false);
    expect(isValidLatitude(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("isValidLongitude", () => {
  it("accepts valid negative longitudes", () => {
    expect(isValidLongitude(-70.66)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
  });
  it("accepts valid positive longitudes", () => {
    expect(isValidLongitude(180)).toBe(true);
  });
  it("rejects out of range", () => {
    expect(isValidLongitude(-181)).toBe(false);
    expect(isValidLongitude(181)).toBe(false);
  });
});

describe("isValidCoordinate", () => {
  it("accepts valid coordinate", () => {
    expect(isValidCoordinate({ latitude: -33.45, longitude: -70.66 })).toBe(true);
  });
  it("rejects invalid latitude", () => {
    expect(isValidCoordinate({ latitude: -91, longitude: -70.66 })).toBe(false);
  });
  it("rejects invalid longitude", () => {
    expect(isValidCoordinate({ latitude: -33.45, longitude: -181 })).toBe(false);
  });
});

describe("validateCoordinate", () => {
  it("does not throw for valid", () => {
    expect(() => validateCoordinate({ latitude: -33.45, longitude: -70.66 })).not.toThrow();
  });
  it("throws for invalid latitude", () => {
    expect(() => validateCoordinate({ latitude: 999, longitude: -70.66 })).toThrow("Latitud inválida");
  });
  it("throws for invalid longitude", () => {
    expect(() => validateCoordinate({ latitude: -33.45, longitude: 999 })).toThrow("Longitud inválida");
  });
});

describe("formatCoordinate", () => {
  it("formats with 5 decimals", () => {
    expect(formatCoordinate({ latitude: -33.45, longitude: -70.66 })).toBe("-33.45000, -70.66000");
  });
  it("preserves negative signs", () => {
    const result = formatCoordinate({ latitude: -33.4521, longitude: -70.6536 });
    expect(result).toContain("-33.45210");
    expect(result).toContain("-70.65360");
  });
  it("handles positive values", () => {
    expect(formatCoordinate({ latitude: 10.5, longitude: 20.3 })).toBe("10.50000, 20.30000");
  });
});

describe("serializeCoordinate / deserializeCoordinate", () => {
  it("round-trips negative coordinates", () => {
    const original: Coordinate = { latitude: -33.4521, longitude: -70.6536 };
    const serialized = serializeCoordinate(original);
    const deserialized = deserializeCoordinate(serialized);
    expect(deserialized).toEqual(original);
  });

  it("round-trips positive coordinates", () => {
    const original: Coordinate = { latitude: 10.5, longitude: 20.3 };
    const serialized = serializeCoordinate(original);
    const deserialized = deserializeCoordinate(serialized);
    expect(deserialized).toEqual(original);
  });

  it("serialized JSON contains negative numbers", () => {
    const serialized = serializeCoordinate({ latitude: -33.45, longitude: -70.66 });
    expect(serialized).toContain('"latitude":-33.45');
    expect(serialized).toContain('"longitude":-70.66');
  });

  it("deserializes invalid JSON to null", () => {
    expect(deserializeCoordinate("not-json")).toBeNull();
  });

  it("deserializes missing fields to null", () => {
    expect(deserializeCoordinate('{"latitude":1}')).toBeNull();
  });

  it("deserializes out-of-range to null", () => {
    expect(deserializeCoordinate('{"latitude":999,"longitude":999}')).toBeNull();
  });

  it("deserializes non-number fields to null", () => {
    expect(deserializeCoordinate('{"latitude":"foo","longitude":"bar"}')).toBeNull();
  });
});

describe("regression: negative sign preservation", () => {
  it("Santiago coordinates survive full pipeline", () => {
    const santiago: Coordinate = { latitude: -33.4521, longitude: -70.6536 };
    expect(santiago.latitude).toBeLessThan(0);
    expect(santiago.longitude).toBeLessThan(0);

    const serialized = serializeCoordinate(santiago);
    expect(serialized).toContain("-33.4521");
    expect(serialized).toContain("-70.6536");

    const deserialized = deserializeCoordinate(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized?.latitude).toBe(-33.4521);
    expect(deserialized?.longitude).toBe(-70.6536);

    const formatted = formatCoordinate(deserialized ?? { latitude: 0, longitude: 0 });
    expect(formatted).toBe("-33.45210, -70.65360");
  });

  it("positive coordinate does not gain negative sign", () => {
    const coord: Coordinate = { latitude: 33.4521, longitude: 70.6536 };
    const serialized = serializeCoordinate(coord);
    const deserialized = deserializeCoordinate(serialized);
    expect(deserialized?.latitude).toBe(33.4521);
    expect(deserialized?.longitude).toBe(70.6536);
  });

  it("Arica coordinates (extreme north Chile)", () => {
    const arica: Coordinate = { latitude: -18.35, longitude: -70.33 };
    const serialized = serializeCoordinate(arica);
    const deserialized = deserializeCoordinate(serialized);
    expect(deserialized?.latitude).toBe(-18.35);
    expect(deserialized?.longitude).toBe(-70.33);
  });
});

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export function isValidLatitude(lat: number): boolean {
  return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lon: number): boolean {
  return typeof lon === "number" && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

export function isValidCoordinate(c: Coordinate): boolean {
  return isValidLatitude(c.latitude) && isValidLongitude(c.longitude);
}

export function validateCoordinate(c: Coordinate): void {
  if (!isValidLatitude(c.latitude)) {
    throw new Error(`Latitud inválida: ${c.latitude}`);
  }
  if (!isValidLongitude(c.longitude)) {
    throw new Error(`Longitud inválida: ${c.longitude}`);
  }
}

export type CoordinateAxis = "latitude" | "longitude";

export type CoordinateInputError = "empty" | "not-a-number" | "out-of-range";

export type CoordinateParseResult =
  | { ok: true; value: number }
  | { ok: false; error: CoordinateInputError };

export type CoordinateFieldsResult =
  | { ok: true; coordinate: Coordinate }
  | {
      ok: false;
      errors: { latitude?: CoordinateInputError; longitude?: CoordinateInputError };
    };

const DECIMAL_PATTERN = /^[+-]?(\d+(\.\d+)?|\.\d+)$/;

export function parseCoordinateInput(raw: string, axis: CoordinateAxis): CoordinateParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false, error: "empty" };

  const normalized = trimmed.replace(",", ".");
  if (!DECIMAL_PATTERN.test(normalized)) return { ok: false, error: "not-a-number" };

  const value = Number(normalized);
  if (!Number.isFinite(value)) return { ok: false, error: "not-a-number" };

  const inRange = axis === "latitude" ? isValidLatitude(value) : isValidLongitude(value);
  if (!inRange) return { ok: false, error: "out-of-range" };

  return { ok: true, value };
}

export function parseCoordinateFields(
  latitudeRaw: string,
  longitudeRaw: string,
): CoordinateFieldsResult {
  const latitude = parseCoordinateInput(latitudeRaw, "latitude");
  const longitude = parseCoordinateInput(longitudeRaw, "longitude");

  if (latitude.ok && longitude.ok) {
    return { ok: true, coordinate: { latitude: latitude.value, longitude: longitude.value } };
  }

  const errors: { latitude?: CoordinateInputError; longitude?: CoordinateInputError } = {};
  if (!latitude.ok) errors.latitude = latitude.error;
  if (!longitude.ok) errors.longitude = longitude.error;
  return { ok: false, errors };
}

export function formatCoordinate(c: Coordinate): string {
  return `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
}

export function serializeCoordinate(c: Coordinate): string {
  return JSON.stringify({ latitude: c.latitude, longitude: c.longitude });
}

export function deserializeCoordinate(raw: string): Coordinate | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      isValidLatitude(parsed.latitude) &&
      isValidLongitude(parsed.longitude)
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

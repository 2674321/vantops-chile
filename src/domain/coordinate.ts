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

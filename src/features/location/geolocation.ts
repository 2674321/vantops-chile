import type { Coordinate } from "../../domain/coordinate";

const LAST_LOCATION_KEY = "vantops.lastLocation";

export type GeolocationErrorCode =
  | "GEOLOCATION_DENIED"
  | "GEOLOCATION_UNAVAILABLE"
  | "GEOLOCATION_TIMEOUT";

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 300_000,
};

function mapGeolocationError(error: GeolocationPositionError): GeolocationErrorCode {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "GEOLOCATION_DENIED";
    case error.POSITION_UNAVAILABLE:
      return "GEOLOCATION_UNAVAILABLE";
    default:
      return "GEOLOCATION_TIMEOUT";
  }
}

export function getCurrentCoordinate(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("GEOLOCATION_UNAVAILABLE"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(mapGeolocationError(error)));
      },
      OPTIONS,
    );
  });
}

export function loadLastLocation(): Coordinate | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "latitude" in parsed &&
      "longitude" in parsed
    ) {
      const { latitude, longitude } = parsed as Record<string, unknown>;
      if (typeof latitude === "number" && typeof longitude === "number") {
        return { latitude, longitude };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastLocation(coordinate: Coordinate): void {
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(coordinate));
  } catch {
    // almacenamiento no disponible: la app sigue funcionando sin persistir
  }
}

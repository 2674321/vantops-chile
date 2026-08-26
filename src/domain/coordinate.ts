export interface Coordinate {
  latitude: number;
  longitude: number;
}

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function formatCoordinate({ latitude, longitude }: Coordinate): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

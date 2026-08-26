import type { ElevationResult } from "../../domain/elevation";
import type { DataSourceMeta } from "../../domain/sourceMeta";

const BASE = "https://api.open-meteo.com/v1/elevation";

export class ElevationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ElevationError";
  }
}

export function buildElevationUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
  });
  return `${BASE}?${params}`;
}

interface OpenMeteoElevationResponse {
  elevation?: (number | null)[];
}

export async function fetchElevation(
  lat: number,
  lon: number
): Promise<ElevationResult> {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new ElevationError("Coordenadas inválidas");
  }
  const requestedAt = new Date().toISOString();
  const res = await fetch(buildElevationUrl(lat, lon));
  if (!res.ok) throw new ElevationError(`HTTP ${res.status}`);
  const data: OpenMeteoElevationResponse = await res.json();
  const meters = data.elevation?.[0] ?? null;
  if (meters === null) throw new ElevationError("Sin datos de elevación");
  const meta: DataSourceMeta = {
    source: "Open-Meteo Elevation",
    requestedAt,
    receivedAt: new Date().toISOString(),
    status: "updated",
  };
  return { meters, meta };
}

import type { ElevationResult } from "../../domain/elevation";
import type { DataSourceMeta } from "../../domain/sourceMeta";
import { ProviderError } from "../../domain/providerError";
import type { ProviderErrorKind } from "../../domain/providerError";
import { recordProviderError } from "../../domain/providerDiagnostic";

const BASE = "https://api.open-meteo.com/v1/elevation";
const REQUEST_TIMEOUT_MS = 8000;

export class ElevationError extends ProviderError {
  constructor(kind: ProviderErrorKind, message: string, status?: number) {
    super("Open-Meteo Elevation", kind, message, status);
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
    throw recordProviderError(new ElevationError("invalid-input", "Coordenadas inválidas"));
  }
  const requestedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(buildElevationUrl(lat, lon), { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw recordProviderError(new ElevationError("timeout", "Timeout al consultar Open-Meteo Elevation"));
    }
    throw recordProviderError(new ElevationError("offline", "No se pudo contactar Open-Meteo Elevation"));
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw recordProviderError(
      new ElevationError("http", `HTTP ${res.status}`, res.status)
    );
  }
  let data: OpenMeteoElevationResponse;
  try {
    data = (await res.json()) as OpenMeteoElevationResponse;
  } catch {
    throw recordProviderError(
      new ElevationError("invalid-response", "Respuesta JSON inválida de Open-Meteo Elevation")
    );
  }
  const meters = data.elevation?.[0] ?? null;
  if (typeof meters !== "number" || !Number.isFinite(meters)) {
    throw recordProviderError(new ElevationError("no-data", "Sin datos de elevación"));
  }
  const meta: DataSourceMeta = {
    source: "Open-Meteo Elevation",
    requestedAt,
    receivedAt: new Date().toISOString(),
    status: "updated",
  };
  return { meters, meta };
}

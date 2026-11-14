import type { ObservationSnapshot } from "../../domain/observation";
import type { DataSourceMeta } from "../../domain/sourceMeta";
import { ProviderError } from "../../domain/providerError";
import type { ProviderErrorKind } from "../../domain/providerError";
import { findNearestStations, type StationDef } from "./stations";
import { decodeMetar, parseMetarObservedAt } from "./metarDecoder";
import { recordProviderError } from "../../domain/providerDiagnostic";

const VATSIM_URL = "https://metar.vatsim.net";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_STATION_ATTEMPTS = 3;

export const VATSIM_SOURCE_LABEL = "VATSIM METAR";

export class ObservationError extends ProviderError {
  constructor(kind: ProviderErrorKind, message: string, status?: number) {
    super("VATSIM METAR", kind, message, status);
    this.name = "ObservationError";
  }
}

function detectMalformedMetar(raw: string): boolean {
  const stripped = raw.replace(/^(METAR|SPECI)\s+/, "").trim();
  if (stripped.length < 15) return true;
  if (!/[A-Z]{4}/.test(stripped)) return true;
  if (!/\d{6}Z/.test(stripped)) return true;
  return false;
}

async function fetchStationObservation(
  station: StationDef,
  distanceKm: number
): Promise<ObservationSnapshot> {
  const requestedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${VATSIM_URL}/${station.icao}`, {
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw recordProviderError(new ObservationError("timeout", "Timeout al consultar VATSIM METAR"));
    }
    throw recordProviderError(new ObservationError("offline", "No se pudo contactar VATSIM METAR"));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw recordProviderError(new ObservationError("http", `HTTP ${res.status}`, res.status));
  }

  const raw = (await res.text()).trim();
  const receivedAt = new Date().toISOString();

  const noDataMeta = (error: string): ObservationSnapshot => ({
    observation: null,
    stationName: station.name,
    stationIcao: station.icao,
    distanceKm,
    meta: {
      source: VATSIM_SOURCE_LABEL,
      requestedAt,
      receivedAt,
      status: "no-data",
      error,
    },
  });

  if (!raw) {
    return noDataMeta(`Respuesta vacía para ${station.icao}`);
  }

  if (/\bNIL\b/i.test(raw)) {
    return noDataMeta(`METAR NIL para ${station.icao}`);
  }

  if (detectMalformedMetar(raw)) {
    return noDataMeta(`METAR malformado para ${station.icao}`);
  }

  const reportedStation = raw.replace(/^(METAR|SPECI)\s+/, "").trim().slice(0, 4);
  if (reportedStation !== station.icao) {
    return noDataMeta(
      `VATSIM devolvió ${reportedStation || "una estación desconocida"} al consultar ${station.icao}`
    );
  }

  const metar = decodeMetar(raw);
  const observedISO = parseMetarObservedAt(raw);
  if (!observedISO) {
    return {
      observation: null,
      stationName: station.name,
      stationIcao: station.icao,
      distanceKm,
      meta: {
        source: VATSIM_SOURCE_LABEL,
        requestedAt,
        receivedAt,
        status: "no-data",
        error: `METAR sin hora de observación válida para ${station.icao}`,
      },
    };
  }
  metar.observedAtISO = observedISO;
  const ageMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(observedISO).getTime()) / 60_000)
  );
  const status: DataSourceMeta["status"] =
    ageMinutes <= 120 ? "updated" : ageMinutes <= 360 ? "stale" : "error";
  return {
    observation: metar,
    stationName: station.name,
    stationIcao: station.icao,
    distanceKm,
    meta: {
      source: VATSIM_SOURCE_LABEL,
      requestedAt,
      receivedAt,
      dataTime: observedISO,
      status,
      error:
        status === "error"
          ? `METAR de hace ${ageMinutes} min (posiblemente obsoleto)`
          : undefined,
    },
  };
}

export async function fetchNearestObservation(
  lat: number,
  lon: number
): Promise<ObservationSnapshot> {
  const candidates = findNearestStations(lat, lon, MAX_STATION_ATTEMPTS);
  let nearestWithoutData: ObservationSnapshot | null = null;

  for (const [index, candidate] of candidates.entries()) {
    const snapshot = await fetchStationObservation(
      candidate.station,
      candidate.distanceKm
    );
    if (snapshot.observation) {
      if (index > 0) {
        snapshot.meta.error = `Sin reporte utilizable en ${candidates[0].station.icao}; se muestra alternativa ${candidate.station.icao} a ${candidate.distanceKm} km`;
      }
      return snapshot;
    }
    nearestWithoutData ??= snapshot;
  }

  if (!nearestWithoutData) {
    throw recordProviderError(
      new ObservationError("invalid-response", "No hay estaciones METAR configuradas")
    );
  }
  nearestWithoutData.meta.error = `${nearestWithoutData.meta.error}. Sin alternativa utilizable en las ${candidates.length} estaciones más cercanas`;
  return nearestWithoutData;
}

import type { ObservationSnapshot } from "../../domain/observation";
import type { DataSourceMeta } from "../../domain/sourceMeta";
import { ProviderError } from "../../domain/providerError";
import type { ProviderErrorKind } from "../../domain/providerError";
import { findNearestStation } from "./stations";
import { decodeMetar, parseMetarObservedAt } from "./metarDecoder";
import { recordProviderError } from "../../domain/providerDiagnostic";

const VATSIM_URL = "https://metar.vatsim.net";
const REQUEST_TIMEOUT_MS = 10000;

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

export async function fetchNearestObservation(
  lat: number,
  lon: number
): Promise<ObservationSnapshot> {
  const { station, distanceKm } = findNearestStation(lat, lon);
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

  const metar = decodeMetar(raw);
  const observedISO = parseMetarObservedAt(raw);
  if (!observedISO) {
    return {
      observation: metar,
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

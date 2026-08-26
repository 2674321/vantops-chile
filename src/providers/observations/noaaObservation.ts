import type { ObservationSnapshot } from "../../domain/observation";
import type { DataSourceMeta } from "../../domain/sourceMeta";
import { findNearestStation } from "./stations";
import { decodeMetar } from "./metarDecoder";

const VATSIM_URL = "https://metar.vatsim.net";

export class ObservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservationError";
  }
}

function parseObsTimeFromRaw(raw: string): string {
  const dayHourMatch = raw.match(/\b(\d{2})(\d{2})Z\b/);
  if (!dayHourMatch) return "";
  const day = Number.parseInt(dayHourMatch[1], 10);
  const hour = Number.parseInt(dayHourMatch[2], 10);
  const now = new Date();
  const obs = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    day,
    hour,
    0,
    0
  ));
  if (obs.getTime() > now.getTime() + 24 * 3600_000) {
    obs.setUTCMonth(obs.getUTCMonth() - 1);
  }
  return obs.toISOString();
}

export async function fetchNearestObservation(
  lat: number,
  lon: number
): Promise<ObservationSnapshot> {
  const { station, distanceKm } = findNearestStation(lat, lon);
  const requestedAt = new Date().toISOString();
  const res = await fetch(`${VATSIM_URL}/${station.icao}`);
  if (!res.ok) throw new ObservationError(`HTTP ${res.status}`);
  const raw = (await res.text()).trim();
  if (!raw || /METAR\s+\w+\s+\d{6}Z\s+NIL/i.test(raw)) {
    return {
      observation: null,
      stationName: station.name,
      stationIcao: station.icao,
      distanceKm,
      meta: {
        source: "VATSIM METAR",
        requestedAt,
        receivedAt: new Date().toISOString(),
        status: "no-data",
        error: `Sin METAR reciente para ${station.icao}`,
      },
    };
  }
  const metar = decodeMetar(raw);
  const observedISO = parseObsTimeFromRaw(raw);
  metar.observedAtISO = observedISO;
  metar.observedAtLocal = observedISO
    ? new Date(observedISO).toLocaleString("es-CL", {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : "";
  const ageMinutes = observedISO
    ? Math.round((Date.now() - new Date(observedISO).getTime()) / 60_000)
    : 9999;
  const status: DataSourceMeta["status"] =
    ageMinutes <= 120 ? "updated" : ageMinutes <= 360 ? "stale" : "error";
  return {
    observation: metar,
    stationName: station.name,
    stationIcao: station.icao,
    distanceKm,
    meta: {
      source: "VATSIM METAR",
      requestedAt,
      receivedAt: new Date().toISOString(),
      status,
      error:
        status === "error"
          ? `METAR de hace ${ageMinutes} min (posiblemente obsoleto)`
          : undefined,
    },
  };
}

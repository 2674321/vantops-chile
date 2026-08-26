import type { ObservationSnapshot } from "../../domain/observation";
import type { DataSourceMeta } from "../../domain/sourceMeta";
import { findNearestStation } from "./stations";
import { decodeMetar } from "./metarDecoder";

const NOAA_URL = "https://aviationweather.gov/api/data/metar";

export class ObservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservationError";
  }
}

interface NoaaMetarItem {
  icaoId: string;
  obsTime?: number;
  reportTime?: string;
  temp?: number | null;
  dewp?: number | null;
  wdir?: number | null;
  wspd?: number | null;
  wgust?: number | null;
  visib?: number | null;
  rawOb?: string;
}

function ktToKmh(kt: number): number {
  return Math.round(kt * 1.852);
}

function milesToMeters(mi: number): number {
  return Math.round(mi * 1609.34);
}

function formatLocal(iso: string, tz = "America/Santiago"): string {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export async function fetchNearestObservation(
  lat: number,
  lon: number
): Promise<ObservationSnapshot> {
  const { station, distanceKm } = findNearestStation(lat, lon);
  const requestedAt = new Date().toISOString();
  const res = await fetch(
    `${NOAA_URL}?ids=${station.icao}&format=json`
  );
  if (!res.ok) throw new ObservationError(`HTTP ${res.status}`);
  const data: NoaaMetarItem[] = await res.json();
  if (!data?.length) {
    return {
      observation: null,
      stationName: station.name,
      stationIcao: station.icao,
      distanceKm,
      meta: {
        source: "NOAA Aviation Weather",
        requestedAt,
        receivedAt: new Date().toISOString(),
        status: "no-data",
        error: `Sin METAR reciente para ${station.icao}`,
      },
    };
  }
  const item = data[0];
  let observedISO = "";
  if (item.obsTime) {
    observedISO = new Date(item.obsTime * 1000).toISOString();
  } else if (item.reportTime) {
    observedISO = new Date(item.reportTime).toISOString();
  }
  const metar = item.rawOb
    ? decodeMetar(item.rawOb)
    : {
        station: station.icao,
        observedAtISO: observedISO,
        observedAtLocal: formatLocal(observedISO),
        windDirDeg: item.wdir ?? null,
        windKmh: item.wspd != null ? ktToKmh(item.wspd) : null,
        gustKmh: item.wgust != null ? ktToKmh(item.wgust) : null,
        visibilityM: item.visib != null ? milesToMeters(item.visib) : null,
        visibilityLabel:
          item.visib != null ? `${milesToMeters(item.visib)} m` : "—",
        tempC: item.temp ?? null,
        dewC: item.dewp ?? null,
        qnhHpa: null,
        clouds: [],
        phenomena: [],
        raw: item.rawOb ?? "",
      };
  metar.observedAtISO = observedISO;
  metar.observedAtLocal = formatLocal(observedISO);
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
      source: "NOAA Aviation Weather",
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

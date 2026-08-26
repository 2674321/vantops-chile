import type { DataSourceMeta } from "./sourceMeta";

export interface CloudLayer {
  cover: "FEW" | "SCT" | "BKN" | "OVC";
  feet: number;
}

export interface MetarObservation {
  station: string;
  observedAtISO: string;
  observedAtLocal: string;
  windDirDeg: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  visibilityM: number | null;
  visibilityLabel: string;
  tempC: number | null;
  dewC: number | null;
  qnhHpa: number | null;
  clouds: CloudLayer[];
  phenomena: string[];
  raw: string;
}

export interface ObservationSnapshot {
  observation: MetarObservation | null;
  stationName: string;
  stationIcao: string;
  distanceKm: number | null;
  meta: DataSourceMeta;
}

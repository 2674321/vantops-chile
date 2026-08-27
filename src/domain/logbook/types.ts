import type { Coordinate } from "../coordinate";
import type { ChecklistState } from "../checklist/types";

export type OperationType =
  | "RECREATIONAL"
  | "PHOTOGRAPHY"
  | "INSPECTION"
  | "EMERGENCY"
  | "TRAINING"
  | "OTHER";

export type FlightIncidentType =
  | "BATTERY"
  | "WEATHER"
  | "SIGNAL"
  | "RTH"
  | "LANDING"
  | "OTHER";

export interface FlightIncident {
  id: string;
  type: FlightIncidentType;
  notes?: string;
}

export interface AircraftSnapshot {
  id: string;
  name: string;
  type?: string;
  manufacturer?: string;
  model?: string;
}

export interface WeatherSnapshotRecord {
  current: {
    temperatureC: number | null;
    humidityPct: number | null;
    precipitationMm: number | null;
    weatherCode: number;
    windSpeedKmh: number | null;
    windGustsKmh: number | null;
    windDirectionDeg: number | null;
    windSpeed100mKmh: number | null;
    windDirection100mDeg: number | null;
    visibilityM: number | null;
    cloudCoverPct: number | null;
  };
  capturedAt: string;
}

export interface ObservationSnapshotRecord {
  stationIcao?: string;
  stationName?: string;
  observedAt?: string;
  rawMetar?: string;
  windKmh?: number | null;
  windDirDeg?: number | null;
  gustKmh?: number | null;
  visibilityM?: number | null;
  visibilityLabel?: string;
  tempC?: number | null;
  qnhHpa?: number | null;
  clouds?: Array<{ cover: string; feet: number }>;
  phenomena?: string[];
  distanceKm?: number | null;
  capturedAt: string;
}

export interface AssessmentSnapshotRecord {
  status: string;
  reasons: Array<{
    code: string;
    severity: string;
    message: string;
    source?: string;
  }>;
  evaluatedAt: string;
  missingData: string[];
  capturedAt: string;
}

export interface ChecklistSnapshotRecord {
  states: ChecklistState[];
  totalItems: number;
  checkedItems: number;
  capturedAt: string;
}

export interface FlightRecord {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  coordinate: Coordinate;
  elevation?: number;
  aircraftId?: string;
  aircraftSnapshot?: AircraftSnapshot;
  weatherSnapshot?: WeatherSnapshotRecord;
  observationSnapshot?: ObservationSnapshotRecord;
  assessmentSnapshot?: AssessmentSnapshotRecord;
  checklistSnapshot?: ChecklistSnapshotRecord;
  batteryId?: string;
  batteryStartPct?: number;
  batteryEndPct?: number;
  operationType?: OperationType;
  incidents?: FlightIncident[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatteryRecord {
  id: string;
  name: string;
  cycleCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  RECREATIONAL: "Recreacional",
  PHOTOGRAPHY: "Fotografía",
  INSPECTION: "Inspección",
  EMERGENCY: "Emergencia",
  TRAINING: "Entrenamiento",
  OTHER: "Otro",
};

export const INCIDENT_TYPE_LABELS: Record<FlightIncidentType, string> = {
  BATTERY: "Batería",
  WEATHER: "Clima",
  SIGNAL: "Señal",
  RTH: "RTH",
  LANDING: "Aterrizaje",
  OTHER: "Otro",
};

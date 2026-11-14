import type { Coordinate } from "../coordinate";
import type { FlightLimits } from "../assessment/limits";
import type {
  AircraftSnapshot,
  AssessmentSnapshotRecord,
  ChecklistSnapshotRecord,
  ObservationSnapshotRecord,
  OperationType,
  WeatherSnapshotRecord,
} from "../logbook/types";

export type FlightPlanStatus = "DRAFT" | "REVIEWED" | "POSTPONED" | "ARCHIVED";

export interface FlightPlan {
  id: string;
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  location: Coordinate;
  locationLabel?: string;
  radiusMeters?: number;
  aircraftId?: string;
  aircraftSnapshot?: AircraftSnapshot;
  operationType?: OperationType;
  flightLimitsSnapshot?: FlightLimits;
  assessmentSnapshot?: AssessmentSnapshotRecord;
  weatherSnapshot?: WeatherSnapshotRecord;
  observationSnapshot?: ObservationSnapshotRecord;
  checklistSnapshot?: ChecklistSnapshotRecord;
  operatorNotes?: string;
  postponedReason?: string;
  status: FlightPlanStatus;
  linkedFlightId?: string;
}

export const FLIGHT_PLAN_STATUS_LABELS: Record<FlightPlanStatus, string> = {
  DRAFT: "Borrador",
  REVIEWED: "Revisado",
  POSTPONED: "Pospuesto",
  ARCHIVED: "Archivado",
};

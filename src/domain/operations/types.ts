import type { ActiveLocationSelection } from "../locationSelection";
import type { AircraftSnapshot, OperationType } from "../logbook/types";

export type OperationSessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type FlightRunStatus = "IN_FLIGHT" | "LANDED" | "INTERRUPTED";
export type OperationTimeSource = "DEVICE_USER_ACTION" | "MANUAL_CORRECTION";

export interface FlightRun {
  id: string;
  status: FlightRunStatus;
  startedAt: string;
  endedAt?: string;
  flightRecordId?: string;
  aircraftSnapshot?: AircraftSnapshot;
  batteryId?: string;
  batteryStartPct?: number;
  batteryEndPct?: number;
  notes?: string;
  timeSource: OperationTimeSource;
  startCommandId: string;
  finishCommandId?: string;
}

export interface OperationSession {
  id: string;
  schemaVersion: 1;
  status: OperationSessionStatus;
  planId?: string;
  mapId?: string;
  zoneId?: string;
  locationSnapshot: ActiveLocationSelection;
  aircraftSnapshot?: AircraftSnapshot;
  operationType?: OperationType;
  startedAt: string;
  endedAt?: string;
  flights: FlightRun[];
  notes?: string;
  cancellationReason?: string;
  startCommandId: string;
  completeCommandId?: string;
  createdAt: string;
  updatedAt: string;
}

export const MAX_FLIGHTS_PER_SESSION = 100;
export const MAX_OPERATION_SESSIONS_PER_BACKUP = 5000;
export const MAX_OPERATION_NOTES_LENGTH = 4000;

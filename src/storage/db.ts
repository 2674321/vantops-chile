import Dexie, { type Table } from "dexie";
import type { FlightRecord, BatteryRecord, SavedPlace, SettingRecord } from "../domain/logbook/types";
import type { FlightPlan } from "../domain/flightPlan/types";
import type { SavedOperationalMap } from "../domain/operationalMap";
import type { FormDraft } from "../domain/drafts";
import type { OperationSession } from "../domain/operations/types";

const DB_NAME = "vantops";

export class VantOpsDB extends Dexie {
  flights!: Table<FlightRecord, string>;
  batteries!: Table<BatteryRecord, string>;
  places!: Table<SavedPlace, string>;
  settings!: Table<SettingRecord, string>;
  plans!: Table<FlightPlan, string>;
  operationalMaps!: Table<SavedOperationalMap, string>;
  drafts!: Table<FormDraft, string>;
  operationSessions!: Table<OperationSession, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId",
      batteries: "id, name, createdAt",
    });
    this.version(2).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId",
      batteries: "id, name, createdAt",
      places: "id, name, createdAt",
      settings: "id",
    });
    this.version(3).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId, planId",
      batteries: "id, name, createdAt",
      places: "id, name, createdAt",
      settings: "id",
      plans: "id, status, createdAt, updatedAt, scheduledStartAt, linkedFlightId",
    });
    this.version(4).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId, planId",
      batteries: "id, name, createdAt",
      places: "id, name, createdAt",
      settings: "id",
      plans: "id, status, createdAt, updatedAt, scheduledStartAt, linkedFlightId",
      operationalMaps: "id, name, createdAt, updatedAt",
    });
    this.version(5).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId, planId",
      batteries: "id, name, createdAt",
      places: "id, name, createdAt",
      settings: "id",
      plans: "id, status, createdAt, updatedAt, scheduledStartAt, linkedFlightId",
      operationalMaps: "id, name, createdAt, updatedAt",
      drafts: "id, kind, updatedAt",
    });
    this.version(6).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId, planId, operationSessionId",
      batteries: "id, name, createdAt",
      places: "id, name, createdAt",
      settings: "id",
      plans: "id, status, createdAt, updatedAt, scheduledStartAt, linkedFlightId",
      operationalMaps: "id, name, createdAt, updatedAt",
      drafts: "id, kind, updatedAt",
      operationSessions: "id, status, startedAt, endedAt, planId, updatedAt",
    });
  }
}

let _db: VantOpsDB | null = null;

export function getDB(): VantOpsDB {
  if (!_db) {
    _db = new VantOpsDB();
  }
  return _db;
}

export function resetDB(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

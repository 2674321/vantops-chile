import Dexie, { type Table } from "dexie";
import type { FlightRecord, BatteryRecord, SavedPlace, SettingRecord } from "../domain/logbook/types";
import type { FlightPlan } from "../domain/flightPlan/types";

const DB_NAME = "vantops";

export class VantOpsDB extends Dexie {
  flights!: Table<FlightRecord, string>;
  batteries!: Table<BatteryRecord, string>;
  places!: Table<SavedPlace, string>;
  settings!: Table<SettingRecord, string>;
  plans!: Table<FlightPlan, string>;

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

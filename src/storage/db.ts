import Dexie, { type Table } from "dexie";
import type { FlightRecord, BatteryRecord } from "../domain/logbook/types";

const DB_NAME = "vantops";
const DB_VERSION = 1;

export class VantOpsDB extends Dexie {
  flights!: Table<FlightRecord, string>;
  batteries!: Table<BatteryRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      flights: "id, startedAt, createdAt, aircraftId, batteryId",
      batteries: "id, name, createdAt",
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

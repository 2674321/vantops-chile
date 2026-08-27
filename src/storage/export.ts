import { getDB } from "./db";
import type { FlightRecord, BatteryRecord } from "../domain/logbook/types";

export interface BackupData {
  format: "vantops-backup";
  version: number;
  exportedAt: string;
  appVersion: string;
  flights: FlightRecord[];
  batteries: BatteryRecord[];
}

export async function exportBackup(appVersion: string): Promise<BackupData> {
  const db = getDB();
  const flights = await db.flights.toArray();
  const batteries = await db.batteries.toArray();
  return {
    format: "vantops-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion,
    flights,
    batteries,
  };
}

export function validateBackup(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.format !== "vantops-backup") return false;
  if (typeof obj.version !== "number") return false;
  if (!Array.isArray(obj.flights)) return false;
  if (!Array.isArray(obj.batteries)) return false;
  return true;
}

export async function importBackup(data: BackupData): Promise<{ flights: number; batteries: number }> {
  const db = getDB();
  let flightsImported = 0;
  let batteriesImported = 0;

  await db.transaction("rw", [db.flights, db.batteries], async () => {
    for (const flight of data.flights) {
      if (typeof flight.id === "string" && typeof flight.startedAt === "string") {
        const existing = await db.flights.get(flight.id);
        if (!existing) {
          await db.flights.add(flight);
          flightsImported++;
        } else if (flight.updatedAt > existing.updatedAt) {
          await db.flights.put(flight);
          flightsImported++;
        }
      }
    }

    for (const battery of data.batteries) {
      if (typeof battery.id === "string" && typeof battery.name === "string") {
        const existing = await db.batteries.get(battery.id);
        if (!existing) {
          await db.batteries.add(battery);
          batteriesImported++;
        } else if (battery.updatedAt > existing.updatedAt) {
          await db.batteries.put(battery);
          batteriesImported++;
        }
      }
    }
  });

  return { flights: flightsImported, batteries: batteriesImported };
}

export function downloadBackup(backup: BackupData): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vantops-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

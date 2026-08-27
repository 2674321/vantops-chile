import { getDB } from "./db";
import type { AircraftProfile } from "../domain/assessment/aircraft";

const MIGRATION_KEY = "vantops:migrated-to-idb";

export function isMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATION_KEY) === "true";
  } catch {
    return false;
  }
}

export async function migrateLocalStorage(): Promise<{ aircraft: boolean; migrated: boolean }> {
  if (isMigrated()) return { aircraft: false, migrated: false };

  const db = getDB();
  let aircraftMigrated = false;

  try {
    const rawAircraft = localStorage.getItem("vantops:activeAircraft");
    if (rawAircraft) {
      const aircraft = JSON.parse(rawAircraft) as AircraftProfile;
      if (aircraft && typeof aircraft.id === "string") {
        const existing = await db.flights.where("aircraftId").equals(aircraft.id).first();
        if (!existing) {
          aircraftMigrated = true;
        }
      }
    }
  } catch {
    // ignore migration errors
  }

  try {
    localStorage.setItem(MIGRATION_KEY, "true");
  } catch {
    // ignore
  }

  return { aircraft: aircraftMigrated, migrated: true };
}

export function clearMigrationFlag(): void {
  try {
    localStorage.removeItem(MIGRATION_KEY);
  } catch {
    // ignore
  }
}

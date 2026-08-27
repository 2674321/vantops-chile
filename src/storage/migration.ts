import { saveSetting } from "./repositories/settingsRepository";
import type { AircraftProfile } from "../domain/assessment/aircraft";
import type { FlightLimits } from "../domain/assessment/limits";
import type { Coordinate } from "../domain/coordinate";

const MIGRATION_KEY = "vantops:migrated-to-idb";

export function isMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATION_KEY) === "true";
  } catch {
    return false;
  }
}

export async function migrateLocalStorage(): Promise<{
  settings: boolean;
  coordinate: boolean;
  migrated: boolean;
}> {
  if (isMigrated()) return { settings: false, coordinate: false, migrated: false };

  let settingsMigrated = false;
  let coordinateMigrated = false;

  try {
    const rawAircraft = localStorage.getItem("vantops:activeAircraft");
    if (rawAircraft) {
      const aircraft = JSON.parse(rawAircraft) as AircraftProfile;
      if (aircraft && typeof aircraft.id === "string") {
        await saveSetting("activeAircraft", aircraft);
        settingsMigrated = true;
      }
    }
  } catch {
    // ignore
  }

  try {
    const rawLimits = localStorage.getItem("vantops:flightLimits");
    if (rawLimits) {
      const limits = JSON.parse(rawLimits) as FlightLimits;
      await saveSetting("flightLimits", limits);
      settingsMigrated = true;
    }
  } catch {
    // ignore
  }

  try {
    let rawCoord = localStorage.getItem("vantops:lastCoordinate");
    if (!rawCoord) {
      rawCoord = localStorage.getItem("vantops.lastLocation");
    }
    if (rawCoord) {
      const coord = JSON.parse(rawCoord) as Coordinate;
      if (typeof coord.latitude === "number" && typeof coord.longitude === "number") {
        await saveSetting("lastCoordinate", coord);
        coordinateMigrated = true;
      }
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(MIGRATION_KEY, "true");
  } catch {
    // ignore
  }

  return { settings: settingsMigrated, coordinate: coordinateMigrated, migrated: true };
}

export function clearMigrationFlag(): void {
  try {
    localStorage.removeItem(MIGRATION_KEY);
  } catch {
    // ignore
  }
}

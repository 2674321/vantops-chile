import type { FlightLimits } from "../domain/assessment/limits";
import type { AircraftProfile } from "../domain/assessment/aircraft";
import { loadSetting, saveSetting } from "./repositories/settingsRepository";
import type { Coordinate } from "../domain/coordinate";

const LIMITS_KEY = "flightLimits";
const AIRCRAFT_KEY = "activeAircraft";
const LAST_COORD_KEY = "lastCoordinate";

const LS_LIMITS_KEY = "vantops:flightLimits";
const LS_AIRCRAFT_KEY = "vantops:activeAircraft";
const LS_MANUFACTURER_KEY = "vantops:selectedManufacturer";
const LS_MODEL_KEY = "vantops:selectedModel";
const LS_LAST_COORD_KEY = "vantops:lastCoordinate";
const LS_OLD_LAST_LOC_KEY = "vantops.lastLocation";

export async function loadFlightLimits(): Promise<FlightLimits> {
  const idb = await loadSetting<FlightLimits>(LIMITS_KEY);
  if (idb) return idb;
  try {
    const raw = localStorage.getItem(LS_LIMITS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FlightLimits;
    await saveSetting(LIMITS_KEY, parsed);
    return parsed;
  } catch {
    return {};
  }
}

export async function saveFlightLimits(limits: FlightLimits): Promise<void> {
  await saveSetting(LIMITS_KEY, limits);
  try {
    localStorage.setItem(LS_LIMITS_KEY, JSON.stringify(limits));
  } catch {
    // ignore
  }
}

export async function loadActiveAircraft(): Promise<AircraftProfile | null> {
  const idb = await loadSetting<AircraftProfile>(AIRCRAFT_KEY);
  if (idb) return idb;
  try {
    const raw = localStorage.getItem(LS_AIRCRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") {
      await saveSetting(AIRCRAFT_KEY, parsed);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveActiveAircraft(aircraft: AircraftProfile): Promise<void> {
  await saveSetting(AIRCRAFT_KEY, aircraft);
  try {
    localStorage.setItem(LS_AIRCRAFT_KEY, JSON.stringify(aircraft));
  } catch {
    // ignore
  }
}

export function loadSelectedManufacturer(): string | null {
  try {
    return localStorage.getItem(LS_MANUFACTURER_KEY);
  } catch {
    return null;
  }
}

export function saveSelectedManufacturer(id: string): void {
  try {
    localStorage.setItem(LS_MANUFACTURER_KEY, id);
  } catch {
    // ignore
  }
}

export function loadSelectedModel(): string | null {
  try {
    return localStorage.getItem(LS_MODEL_KEY);
  } catch {
    return null;
  }
}

export function saveSelectedModel(id: string): void {
  try {
    localStorage.setItem(LS_MODEL_KEY, id);
  } catch {
    // ignore
  }
}

export function clearAircraftSelection(): void {
  try {
    localStorage.removeItem(LS_AIRCRAFT_KEY);
    localStorage.removeItem(LS_MANUFACTURER_KEY);
    localStorage.removeItem(LS_MODEL_KEY);
  } catch {
    // ignore
  }
}

export async function loadLastCoordinate(): Promise<Coordinate | null> {
  const idb = await loadSetting<Coordinate>(LAST_COORD_KEY);
  if (idb) return idb;
  try {
    const raw = localStorage.getItem(LS_LAST_COORD_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(LS_OLD_LAST_LOC_KEY);
      if (oldRaw) {
        const parsed = JSON.parse(oldRaw) as Coordinate;
        if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
          await saveSetting(LAST_COORD_KEY, parsed);
          return parsed;
        }
      }
      return null;
    }
    const parsed = JSON.parse(raw) as Coordinate;
    if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
      await saveSetting(LAST_COORD_KEY, parsed);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveLastCoordinateToIDB(c: Coordinate): Promise<void> {
  await saveSetting(LAST_COORD_KEY, c);
}

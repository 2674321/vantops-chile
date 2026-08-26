import type { FlightLimits } from "../domain/assessment/limits";
import type { AircraftProfile } from "../domain/assessment/aircraft";

const LIMITS_KEY = "vantops:flightLimits";
const AIRCRAFT_KEY = "vantops:activeAircraft";

export function loadFlightLimits(): FlightLimits {
  try {
    const raw = localStorage.getItem(LIMITS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveFlightLimits(limits: FlightLimits): void {
  try {
    localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
  } catch {
    // storage full or unavailable
  }
}

export function loadActiveAircraft(): AircraftProfile | null {
  try {
    const raw = localStorage.getItem(AIRCRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveActiveAircraft(aircraft: AircraftProfile): void {
  try {
    localStorage.setItem(AIRCRAFT_KEY, JSON.stringify(aircraft));
  } catch {
    // storage full or unavailable
  }
}

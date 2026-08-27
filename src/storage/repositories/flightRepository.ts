import { getDB } from "../db";
import type { FlightRecord } from "../../domain/logbook/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createFlight(data: Partial<FlightRecord>): Promise<FlightRecord> {
  const db = getDB();
  const now = new Date().toISOString();
  const { id: _ignored, ...rest } = data;
  const id = generateId();
  const flight: FlightRecord = {
    ...rest,
    id,
    startedAt: rest.startedAt ?? now,
    coordinate: rest.coordinate ?? { latitude: 0, longitude: 0 },
    createdAt: now,
    updatedAt: now,
  };
  await db.flights.add(flight);
  return flight;
}

export async function getFlight(id: string): Promise<FlightRecord | undefined> {
  const db = getDB();
  return db.flights.get(id);
}

export async function listFlights(limit = 100): Promise<FlightRecord[]> {
  const db = getDB();
  return db.flights.orderBy("startedAt").reverse().limit(limit).toArray();
}

export async function updateFlight(
  id: string,
  changes: Partial<FlightRecord>
): Promise<void> {
  const db = getDB();
  await db.flights.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFlight(id: string): Promise<void> {
  const db = getDB();
  await db.flights.delete(id);
}

export async function countFlights(): Promise<number> {
  const db = getDB();
  return db.flights.count();
}

export async function getFlightsByAircraft(aircraftId: string): Promise<FlightRecord[]> {
  const db = getDB();
  return db.flights.where("aircraftId").equals(aircraftId).reverse().sortBy("startedAt");
}

export async function getTotalFlightTime(): Promise<number> {
  const flights = await listFlights(10000);
  return flights.reduce((sum, f) => sum + (f.durationSeconds ?? 0), 0);
}

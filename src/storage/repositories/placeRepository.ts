import { getDB } from "../db";
import type { SavedPlace } from "../../domain/logbook/types";

function generateId(): string {
  return `place-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createPlace(data: Partial<SavedPlace>): Promise<SavedPlace> {
  const db = getDB();
  const now = new Date().toISOString();
  const { id: _ignored, ...rest } = data;
  const id = generateId();
  const place: SavedPlace = {
    ...rest,
    id,
    name: rest.name ?? "Lugar",
    coordinate: rest.coordinate ?? { latitude: 0, longitude: 0 },
    createdAt: now,
    updatedAt: now,
  };
  await db.places.add(place);
  return place;
}

export async function getPlace(id: string): Promise<SavedPlace | undefined> {
  const db = getDB();
  return db.places.get(id);
}

export async function listPlaces(): Promise<SavedPlace[]> {
  const db = getDB();
  return db.places.orderBy("name").toArray();
}

export async function updatePlace(
  id: string,
  changes: Partial<SavedPlace>
): Promise<void> {
  const db = getDB();
  await db.places.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deletePlace(id: string): Promise<void> {
  const db = getDB();
  await db.places.delete(id);
}

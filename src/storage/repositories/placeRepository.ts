import { getDB } from "../db";
import type { SavedPlace } from "../../domain/logbook/types";
import { isValidCoordinate } from "../../domain/coordinate";

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

export async function createPlaceStrict(data: Pick<SavedPlace, "name" | "coordinate"> & Partial<Pick<SavedPlace, "notes" | "favorite">>): Promise<SavedPlace> {
  if (!data.name.trim() || data.name.trim().length > 120) throw new Error("Asigna un nombre válido al pin.");
  if (!isValidCoordinate(data.coordinate)) throw new Error("La ubicación del pin no es válida.");
  if (data.notes && data.notes.length > 1000) throw new Error("La nota puede tener hasta 1.000 caracteres.");
  return createPlace({ ...data, name: data.name.trim(), notes: data.notes?.trim() || undefined });
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

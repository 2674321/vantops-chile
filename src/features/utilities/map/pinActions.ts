import type { Coordinate } from "../../../domain/coordinate";
import { isValidCoordinate } from "../../../domain/coordinate";
import type { SavedPlace } from "../../../domain/logbook/types";
import { createPlaceStrict, getPlace, listPlaces, updatePlace } from "../../../storage/repositories/placeRepository";
import { getDB } from "../../../storage/db";
import type { SavedOperationalMap } from "../../../domain/operationalMap";

export interface PinInput { name: string; coordinate: Coordinate; notes?: string; favorite?: boolean; }
export async function addSavedPin(input: PinInput): Promise<SavedPlace> { return createPlaceStrict(input); }
export async function moveSavedPin(id: string, coordinate: Coordinate): Promise<SavedPlace> { if (!id || !isValidCoordinate(coordinate)) throw new Error("Pin o posición inválida"); const previous = await getPlace(id); if (!previous) throw new Error("El pin no existe"); await updatePlace(id, { coordinate: structuredClone(coordinate) }); const updated = await getPlace(id); if (!updated) throw new Error("El pin ya no está disponible"); return updated; }
export async function updateSavedPin(id: string, changes: Pick<Partial<SavedPlace>, "name" | "notes" | "favorite">): Promise<SavedPlace> { const previous = await getPlace(id); if (!previous) throw new Error("El pin no existe"); const name = changes.name?.trim(); if (name !== undefined && (!name || name.length > 120)) throw new Error("Nombre de pin inválido"); if (changes.notes && changes.notes.length > 1000) throw new Error("La nota puede tener hasta 1.000 caracteres"); await updatePlace(id, { ...changes, name }); const updated = await getPlace(id); if (!updated) throw new Error("El pin ya no está disponible"); return updated; }
export async function removeSavedPin(id: string): Promise<void> { const db = getDB(); await db.transaction("rw", db.places, db.operationalMaps, async () => { if (!await db.places.get(id)) throw new Error("El pin no existe"); await db.places.delete(id); const maps = await db.operationalMaps.filter((map) => Boolean(map.pinnedPlaceIds?.includes(id))).toArray(); await db.operationalMaps.bulkPut(maps.map((map) => ({ ...map, pinnedPlaceIds: map.pinnedPlaceIds?.filter((pinId) => pinId !== id), updatedAt: new Date().toISOString() }))); }); }
export async function loadSavedPins(): Promise<SavedPlace[]> { return (await listPlaces()).filter((pin) => isValidCoordinate(pin.coordinate)); }

export async function migrateInlineMapPins(map: SavedOperationalMap): Promise<SavedOperationalMap> {
  if (!map.pins?.length) return map;
  const now = new Date().toISOString();
  const migrated = map.pins.map((pin) => ({ id: `place-${map.id}-${pin.id}`.slice(0, 120), name: pin.name, coordinate: pin.coordinate, notes: `Migrado desde ${map.name}`, favorite: false, createdAt: now, updatedAt: now } satisfies SavedPlace));
  const next: SavedOperationalMap = { ...map, pins: [], pinnedPlaceIds: [...new Set([...(map.pinnedPlaceIds ?? []), ...migrated.map((pin) => pin.id)])], updatedAt: now };
  const db = getDB();
  await db.transaction("rw", db.places, db.operationalMaps, async () => { await db.places.bulkPut(migrated); await db.operationalMaps.put(next); });
  return next;
}

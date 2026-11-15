import type { SavedOperationalMap } from "../../domain/operationalMap";
import { MAX_OPERATIONAL_MAPS, isValidSavedOperationalMap } from "../../domain/operationalMap";
import { createLocalId } from "../../lib/id";
import { getDB } from "../db";

export async function listOperationalMaps(): Promise<SavedOperationalMap[]> {
  return getDB().operationalMaps.orderBy("updatedAt").reverse().toArray();
}

export async function getOperationalMap(id: string): Promise<SavedOperationalMap | undefined> {
  return getDB().operationalMaps.get(id);
}

export async function saveOperationalMap(map: SavedOperationalMap): Promise<void> {
  if (!isValidSavedOperationalMap(map)) throw new Error("El mapa contiene datos inválidos.");
  const db = getDB();
  const exists = await db.operationalMaps.get(map.id);
  if (!exists && await db.operationalMaps.count() >= MAX_OPERATIONAL_MAPS) {
    throw new Error(`Se alcanzó el límite técnico de ${MAX_OPERATIONAL_MAPS} mapas.`);
  }
  await db.operationalMaps.put(structuredClone(map));
}

export async function duplicateOperationalMap(source: SavedOperationalMap): Promise<SavedOperationalMap> {
  const now = new Date().toISOString();
  const copy: SavedOperationalMap = {
    ...structuredClone(source),
    id: createLocalId(),
    name: `${source.name} (copia)`,
    zones: source.zones.map((zone) => ({ ...zone, id: createLocalId() })),
    createdAt: now,
    updatedAt: now,
  };
  await saveOperationalMap(copy);
  return copy;
}

export async function deleteOperationalMap(id: string): Promise<void> {
  await getDB().operationalMaps.delete(id);
}

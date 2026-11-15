import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDB, resetDB } from "../db";
import { deleteOperationalMap, duplicateOperationalMap, getOperationalMap, listOperationalMaps, saveOperationalMap } from "./operationalMapRepository";
import type { SavedOperationalMap } from "../../domain/operationalMap";

const fixture = (): SavedOperationalMap => {
  const now = new Date().toISOString();
  return {
    id: "map-qa",
    schemaVersion: 1,
    name: "Mapa QA",
    zones: [{ id: "z1", name: "500 m", center: { latitude: -33.45, longitude: -70.66 }, radiusMeters: 500, color: "#38bdf8", visible: true, fillOpacity: 0.12 }],
    createdAt: now,
    updatedAt: now,
  };
};

beforeEach(async () => {
  resetDB();
  await getDB().delete();
  resetDB();
});

describe("operationalMapRepository", () => {
  it("saves, reopens, duplicates and deletes maps without shared IDs", async () => {
    const map = fixture();
    await saveOperationalMap(map);
    expect(await getOperationalMap(map.id)).toEqual(map);
    const copy = await duplicateOperationalMap(map);
    expect(copy.id).not.toBe(map.id);
    expect(copy.zones[0].id).not.toBe(map.zones[0].id);
    expect(await listOperationalMaps()).toHaveLength(2);
    await deleteOperationalMap(map.id);
    expect(await getOperationalMap(copy.id)).toBeDefined();
  });

  it("rejects invalid maps before writing", async () => {
    await expect(saveOperationalMap({ ...fixture(), zones: [{ ...fixture().zones[0], radiusMeters: 0 }] })).rejects.toThrow("inválidos");
    expect(await listOperationalMaps()).toEqual([]);
  });
});

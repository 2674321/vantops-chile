import { getDB } from "../db";
import type { BatteryRecord } from "../../domain/logbook/types";

function generateId(): string {
  return `bat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createBattery(data: Partial<BatteryRecord>): Promise<BatteryRecord> {
  const db = getDB();
  const now = new Date().toISOString();
  const { id: _ignored, ...rest } = data;
  const id = generateId();
  const battery: BatteryRecord = {
    ...rest,
    id,
    name: rest.name ?? "Batería",
    cycleCount: rest.cycleCount ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.batteries.add(battery);
  return battery;
}

export async function getBattery(id: string): Promise<BatteryRecord | undefined> {
  const db = getDB();
  return db.batteries.get(id);
}

export async function listBatteries(): Promise<BatteryRecord[]> {
  const db = getDB();
  return db.batteries.orderBy("name").toArray();
}

export async function updateBattery(
  id: string,
  changes: Partial<BatteryRecord>
): Promise<void> {
  const db = getDB();
  await db.batteries.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBattery(id: string): Promise<void> {
  const db = getDB();
  await db.batteries.delete(id);
}

export async function incrementCycles(id: string): Promise<void> {
  const db = getDB();
  const battery = await db.batteries.get(id);
  if (battery) {
    await db.batteries.update(id, {
      cycleCount: battery.cycleCount + 1,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function markBatteryUsed(id: string): Promise<void> {
  const db = getDB();
  const battery = await db.batteries.get(id);
  if (battery) {
    await db.batteries.update(id, {
      lastUsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

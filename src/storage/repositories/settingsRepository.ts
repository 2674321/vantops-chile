import { getDB } from "../db";

export async function loadSetting<T>(key: string): Promise<T | null> {
  const db = getDB();
  const record = await db.settings.get(key);
  if (!record) return null;
  try {
    return JSON.parse(record.value) as T;
  } catch {
    return null;
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = getDB();
  await db.settings.put({
    id: key,
    value: JSON.stringify(value),
    updatedAt: new Date().toISOString(),
  });
}

export async function removeSetting(key: string): Promise<void> {
  const db = getDB();
  await db.settings.delete(key);
}

export async function listSettings(): Promise<Record<string, unknown>> {
  const db = getDB();
  const records = await db.settings.toArray();
  const result: Record<string, unknown> = {};
  for (const r of records) {
    try {
      result[r.id] = JSON.parse(r.value);
    } catch {
      result[r.id] = r.value;
    }
  }
  return result;
}

import { buildLocationSelection, validateLocationSelection, type ActiveLocationSelection } from "../domain/locationSelection";
import { getDB } from "./db";
import { loadLastCoordinate } from "./settings";
import { loadSetting } from "./repositories/settingsRepository";

export const ACTIVE_LOCATION_KEY = "activeLocationContext";

export async function loadActiveLocation(): Promise<ActiveLocationSelection | null> {
  const stored = await loadSetting<unknown>(ACTIVE_LOCATION_KEY);
  if (validateLocationSelection(stored)) return stored;
  const legacy = await loadLastCoordinate();
  return legacy ? buildLocationSelection(legacy, "legacy-last-coordinate") : null;
}

export async function setActiveLocation(selection: ActiveLocationSelection): Promise<ActiveLocationSelection> {
  if (!validateLocationSelection(selection)) throw new Error("Selección geográfica inválida");
  const now = new Date().toISOString();
  const db = getDB();
  await db.transaction("rw", db.settings, async () => {
    await db.settings.put({ id: "lastCoordinate", value: JSON.stringify(selection.coordinate), updatedAt: now });
    await db.settings.put({ id: ACTIVE_LOCATION_KEY, value: JSON.stringify(selection), updatedAt: now });
  });
  try { localStorage.setItem("vantops:lastCoordinate", JSON.stringify(selection.coordinate)); } catch { /* compatibility cache */ }
  window.dispatchEvent(new CustomEvent("vantops:active-location", { detail: selection }));
  return selection;
}

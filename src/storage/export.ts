import { getDB } from "./db";
import { listSettings, saveSetting } from "./repositories/settingsRepository";
import { downloadTextFile } from "../lib/download";
import { isValidCoordinate } from "../domain/coordinate";
import type { FlightRecord, BatteryRecord, SavedPlace } from "../domain/logbook/types";

export const BACKUP_FORMAT = "vantops-backup" as const;
export const CURRENT_BACKUP_VERSION = 1;
export const MIN_BACKUP_VERSION = 1;
export const MAX_BACKUP_VERSION = 1;

const IMPORTABLE_SETTING_KEYS = new Set([
  "flightLimits",
  "activeAircraft",
  "lastCoordinate",
  "operationZoneRadius",
]);

const NUMERIC_SETTING_KEYS = new Set(["operationZoneRadius"]);

export interface BackupData {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  appVersion: string;
  flights: FlightRecord[];
  batteries: BatteryRecord[];
  places: SavedPlace[];
  settings: Record<string, unknown>;
}

export interface ImportSummary {
  flights: number;
  batteries: number;
  places: number;
  settings: number;
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupValidationError";
  }
}

export async function exportBackup(appVersion: string): Promise<BackupData> {
  const db = getDB();
  const flights = await db.flights.toArray();
  const batteries = await db.batteries.toArray();
  const places = await db.places.toArray();
  const settings = await listSettings();
  return {
    format: BACKUP_FORMAT,
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    flights,
    batteries,
    places,
    settings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isTimestamp(value: unknown): boolean {
  return (
    isString(value) &&
    value.trim() !== "" &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function isValidCoordinatePair(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    isValidCoordinate({ latitude: value.latitude, longitude: value.longitude })
  );
}

function validateFlight(value: unknown): value is FlightRecord {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || value.id === "") return false;
  if (!isTimestamp(value.startedAt)) return false;
  if (!isValidCoordinatePair(value.coordinate)) return false;
  if (value.createdAt !== undefined && !isTimestamp(value.createdAt)) return false;
  if (value.updatedAt !== undefined && !isTimestamp(value.updatedAt)) return false;
  return true;
}

function validateBattery(value: unknown): value is BatteryRecord {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || value.id === "") return false;
  if (!isString(value.name)) return false;
  if (value.cycleCount !== undefined && typeof value.cycleCount !== "number") return false;
  if (value.createdAt !== undefined && !isTimestamp(value.createdAt)) return false;
  if (value.updatedAt !== undefined && !isTimestamp(value.updatedAt)) return false;
  return true;
}

function validatePlace(value: unknown): value is SavedPlace {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || value.id === "") return false;
  if (!isString(value.name)) return false;
  if (!isValidCoordinatePair(value.coordinate)) return false;
  if (value.createdAt !== undefined && !isTimestamp(value.createdAt)) return false;
  if (value.updatedAt !== undefined && !isTimestamp(value.updatedAt)) return false;
  return true;
}

function validateSettings(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const key of Object.keys(value)) {
    if (!IMPORTABLE_SETTING_KEYS.has(key)) continue;
    const entry = value[key];
    if (entry === null || entry === undefined) return false;
    if (Array.isArray(entry)) return false;
    if (NUMERIC_SETTING_KEYS.has(key) && (typeof entry !== "number" || !Number.isFinite(entry))) {
      return false;
    }
  }
  return true;
}

/**
 * Validación estructural del respaldo (type guard usado por la UI).
 * La validación profunda por registro ocurre en `inspectBackup` antes de importar.
 */
export function validateBackup(data: unknown): data is BackupData {
  if (!isRecord(data)) return false;
  if (data.format !== BACKUP_FORMAT) return false;
  if (typeof data.version !== "number" || !Number.isInteger(data.version)) return false;
  if (data.version < MIN_BACKUP_VERSION || data.version > MAX_BACKUP_VERSION) return false;
  if (data.exportedAt !== undefined && !isTimestamp(data.exportedAt)) return false;
  if (data.appVersion !== undefined && !isString(data.appVersion)) return false;
  if (!Array.isArray(data.flights)) return false;
  if (!Array.isArray(data.batteries)) return false;
  if (data.places !== undefined && !Array.isArray(data.places)) return false;
  if (data.settings !== undefined && !validateSettings(data.settings)) return false;
  return true;
}

/**
 * Validación profunda con motivo de error. Utilizada por la UI y por importBackup
 * para rechazar respaldos corruptos o versiones incompatibles de forma clara.
 */
export function inspectBackup(data: unknown): { ok: true; data: BackupData } | { ok: false; error: string } {
  if (!isRecord(data)) {
    return { ok: false, error: "El archivo no es un respaldo de VantOPS." };
  }
  if (data.format !== BACKUP_FORMAT) {
    return { ok: false, error: "Formato no reconocido (se esperaba vantops-backup)." };
  }
  if (typeof data.version !== "number" || !Number.isInteger(data.version)) {
    return { ok: false, error: "Versión de respaldo inválida." };
  }
  if (data.version < MIN_BACKUP_VERSION) {
    return { ok: false, error: `Versión de respaldo antigua (${data.version}). Actualiza VantOPS y vuelve a exportar.` };
  }
  if (data.version > MAX_BACKUP_VERSION) {
    return { ok: false, error: `Versión de respaldo no compatible (${data.version}). Este respaldo fue creado con una versión más reciente de VantOPS.` };
  }
  if (!Array.isArray(data.flights) || !Array.isArray(data.batteries)) {
    return { ok: false, error: "Estructura del respaldo incompleta (flights/batteries)." };
  }
  if (data.places !== undefined && !Array.isArray(data.places)) {
    return { ok: false, error: "La sección de lugares es inválida." };
  }
  if (data.settings !== undefined && !validateSettings(data.settings)) {
    return { ok: false, error: "La sección de configuración es inválida." };
  }

  const flightsValid = data.flights.every(validateFlight);
  if (!flightsValid) {
    return { ok: false, error: "Existen vuelos corruptos en el respaldo (IDs, fechas o coordenadas inválidas)." };
  }
  const batteriesValid = data.batteries.every(validateBattery);
  if (!batteriesValid) {
    return { ok: false, error: "Existen baterías corruptas en el respaldo." };
  }
  const placesValid = data.places === undefined || data.places.every(validatePlace);
  if (!placesValid) {
    return { ok: false, error: "Existen lugares corruptos en el respaldo." };
  }

  return { ok: true, data: data as unknown as BackupData };
}

export async function importBackup(data: BackupData): Promise<ImportSummary> {
  const inspection = inspectBackup(data);
  if (!inspection.ok) {
    throw new BackupValidationError(inspection.error);
  }

  const db = getDB();
  const flights = Array.isArray(inspection.data.flights) ? inspection.data.flights : [];
  const batteries = Array.isArray(inspection.data.batteries) ? inspection.data.batteries : [];
  const places = Array.isArray(inspection.data.places) ? inspection.data.places : [];
  const settings = isRecord(inspection.data.settings) ? inspection.data.settings : {};

  const summary: ImportSummary = { flights: 0, batteries: 0, places: 0, settings: 0 };

  await db.transaction("rw", [db.flights, db.batteries, db.places, db.settings], async () => {
    for (const flight of flights) {
      if (!validateFlight(flight)) continue;
      const existing = await db.flights.get(flight.id);
      if (!existing) {
        await db.flights.add(flight);
        summary.flights++;
      } else if ((flight.updatedAt ?? "") > existing.updatedAt) {
        await db.flights.put(flight);
        summary.flights++;
      }
    }

    for (const battery of batteries) {
      if (!validateBattery(battery)) continue;
      const existing = await db.batteries.get(battery.id);
      if (!existing) {
        await db.batteries.add(battery);
        summary.batteries++;
      } else if ((battery.updatedAt ?? "") > existing.updatedAt) {
        await db.batteries.put(battery);
        summary.batteries++;
      }
    }

    if (Array.isArray(places)) {
      for (const place of places) {
        if (!validatePlace(place)) continue;
        const existing = await db.places.get(place.id);
        if (!existing) {
          await db.places.add(place);
          summary.places++;
        } else if ((place.updatedAt ?? "") > existing.updatedAt) {
          await db.places.put(place);
          summary.places++;
        }
      }
    }

    for (const key of IMPORTABLE_SETTING_KEYS) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const value = settings[key];
        if (value === null || value === undefined || Array.isArray(value)) continue;
        if (NUMERIC_SETTING_KEYS.has(key) && (typeof value !== "number" || !Number.isFinite(value))) {
          continue;
        }
        await saveSetting(key, value);
        summary.settings++;
      }
    }
  });

  return summary;
}

export function countImportableSettings(settings: Record<string, unknown> | undefined): number {
  if (!isRecord(settings)) return 0;
  return Object.keys(settings).filter((k) => IMPORTABLE_SETTING_KEYS.has(k)).length;
}

export function downloadBackup(backup: BackupData): void {
  const json = JSON.stringify(backup, null, 2);
  downloadTextFile(
    `vantops-backup-${backup.exportedAt.slice(0, 10)}.json`,
    json,
    "application/json"
  );
}
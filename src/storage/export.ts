import { getDB } from "./db";
import { listSettings, saveSetting } from "./repositories/settingsRepository";
import { downloadTextFile } from "../lib/download";
import { isValidCoordinate } from "../domain/coordinate";
import type { FlightRecord, BatteryRecord, SavedPlace } from "../domain/logbook/types";
import type { FlightPlan, FlightPlanStatus } from "../domain/flightPlan/types";
import type { SavedOperationalMap } from "../domain/operationalMap";
import { MAX_OPERATIONAL_MAPS, isValidSavedOperationalMap } from "../domain/operationalMap";
import { isValidFormDraft, type FormDraft } from "../domain/drafts";

export const BACKUP_FORMAT = "vantops-backup" as const;
export const CURRENT_BACKUP_VERSION = 4;
export const MIN_BACKUP_VERSION = 1;
export const MAX_BACKUP_VERSION = 4;

const IMPORTABLE_SETTING_KEYS = new Set([
  "flightLimits",
  "activeAircraft",
  "lastCoordinate",
  "operationZoneRadius",
  "displayPreferences",
  "activeLocationContext",
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
  plans?: FlightPlan[];
  operationalMaps?: SavedOperationalMap[];
  drafts?: FormDraft[];
}

export interface ImportSummary {
  flights: number;
  batteries: number;
  places: number;
  settings: number;
  plans: number;
  operationalMaps: number;
  drafts: number;
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
  const plans = await db.plans.toArray();
  const operationalMaps = await db.operationalMaps.toArray();
  const drafts = await db.drafts.toArray();
  return {
    format: BACKUP_FORMAT,
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    flights,
    batteries,
    places,
    settings,
    plans,
    operationalMaps,
    drafts,
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

const PLAN_STATUSES = new Set<FlightPlanStatus>([
  "DRAFT",
  "REVIEWED",
  "POSTPONED",
  "ARCHIVED",
]);

function validatePlan(value: unknown): value is FlightPlan {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || value.id === "") return false;
  if (value.schemaVersion !== 1) return false;
  if (!isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt)) return false;
  if (!isValidCoordinatePair(value.location)) return false;
  if (!isString(value.status) || !PLAN_STATUSES.has(value.status as FlightPlanStatus)) return false;
  if (value.scheduledStartAt !== undefined && !isTimestamp(value.scheduledStartAt)) return false;
  if (value.scheduledEndAt !== undefined && !isTimestamp(value.scheduledEndAt)) return false;
  if (value.linkedFlightId !== undefined && !isString(value.linkedFlightId)) return false;
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
  if (data.plans !== undefined && !Array.isArray(data.plans)) return false;
  if (data.version >= 2 && !Array.isArray(data.plans)) return false;
  if (data.operationalMaps !== undefined && !Array.isArray(data.operationalMaps)) return false;
  if (data.version >= 3 && !Array.isArray(data.operationalMaps)) return false;
  if (data.drafts !== undefined && !Array.isArray(data.drafts)) return false;
  if (data.version >= 4 && !Array.isArray(data.drafts)) return false;
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
  if (data.plans !== undefined && !Array.isArray(data.plans)) {
    return { ok: false, error: "La sección de planes es inválida." };
  }
  if (data.version >= 2 && !Array.isArray(data.plans)) {
    return { ok: false, error: "El respaldo v2 no contiene la sección de planes." };
  }
  if (data.operationalMaps !== undefined && !Array.isArray(data.operationalMaps)) {
    return { ok: false, error: "La sección de mapas de operaciones es inválida." };
  }
  if (data.version >= 3 && !Array.isArray(data.operationalMaps)) {
    return { ok: false, error: "El respaldo v3 no contiene la sección de mapas de operaciones." };
  }
  if (data.drafts !== undefined && !Array.isArray(data.drafts)) return { ok: false, error: "La sección de borradores es inválida." };
  if (data.version >= 4 && !Array.isArray(data.drafts)) return { ok: false, error: "El respaldo v4 no contiene borradores." };
  if (Array.isArray(data.drafts) && (data.drafts.length > 1000 || !data.drafts.every(isValidFormDraft) || new Set(data.drafts.map((draft) => draft.id)).size !== data.drafts.length)) return { ok: false, error: "Existen borradores corruptos en el respaldo." };
  if (Array.isArray(data.operationalMaps) && data.operationalMaps.length > MAX_OPERATIONAL_MAPS) {
    return { ok: false, error: `El respaldo excede el límite de ${MAX_OPERATIONAL_MAPS} mapas.` };
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
  const plansValid = data.plans === undefined || data.plans.every(validatePlan);
  if (!plansValid) {
    return { ok: false, error: "Existen planes corruptos en el respaldo." };
  }
  const mapsValid = data.operationalMaps === undefined || data.operationalMaps.every(isValidSavedOperationalMap);
  if (!mapsValid) {
    return { ok: false, error: "Existen mapas o radios corruptos en el respaldo." };
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
  const plans = Array.isArray(inspection.data.plans) ? inspection.data.plans : [];
  const operationalMaps = Array.isArray(inspection.data.operationalMaps) ? inspection.data.operationalMaps : [];
  const drafts = Array.isArray(inspection.data.drafts) ? inspection.data.drafts : [];

  const summary: ImportSummary = { flights: 0, batteries: 0, places: 0, settings: 0, plans: 0, operationalMaps: 0, drafts: 0 };

  await db.transaction("rw", [db.flights, db.batteries, db.places, db.settings, db.plans, db.operationalMaps, db.drafts], async () => {
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

    for (const plan of plans) {
      if (!validatePlan(plan)) continue;
      const existing = await db.plans.get(plan.id);
      if (!existing) {
        await db.plans.add(plan);
        summary.plans++;
      } else if (plan.updatedAt > existing.updatedAt) {
        await db.plans.put(plan);
        summary.plans++;
      }
    }

    for (const map of operationalMaps) {
      const existing = await db.operationalMaps.get(map.id);
      if (!existing) {
        await db.operationalMaps.add(map);
        summary.operationalMaps++;
      } else if (map.updatedAt > existing.updatedAt) {
        await db.operationalMaps.put(map);
        summary.operationalMaps++;
      }
    }

    for (const draft of drafts) {
      const existing = await db.drafts.get(draft.id);
      if (!existing || draft.updatedAt > existing.updatedAt) { await db.drafts.put(draft); summary.drafts++; }
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

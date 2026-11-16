import type { Coordinate } from "./coordinate";
import { isValidCoordinate } from "./coordinate";

export type LocationSource = "map-click" | "map-pin" | "gps-consented" | "nominatim-result" | "saved-place" | "manual-coordinate" | "legacy-last-coordinate";

export interface ActiveLocationSelection {
  schemaVersion: 1;
  coordinate: Coordinate;
  source: LocationSource;
  label?: string;
  placeId?: string;
  mapId?: string;
  zoneId?: string;
  accuracyMeters?: number;
  selectedAt: string;
}

const SOURCES = new Set<LocationSource>(["map-click", "map-pin", "gps-consented", "nominatim-result", "saved-place", "manual-coordinate", "legacy-last-coordinate"]);

export function validateLocationSelection(value: unknown): value is ActiveLocationSelection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<ActiveLocationSelection>;
  if (item.schemaVersion !== 1 || !item.coordinate || !isValidCoordinate(item.coordinate)) return false;
  if (!item.source || !SOURCES.has(item.source)) return false;
  if (typeof item.selectedAt !== "string" || !Number.isFinite(Date.parse(item.selectedAt))) return false;
  if (item.label !== undefined && (typeof item.label !== "string" || item.label.length > 180)) return false;
  for (const id of [item.placeId, item.mapId, item.zoneId]) if (id !== undefined && (typeof id !== "string" || id.length === 0 || id.length > 120)) return false;
  return item.accuracyMeters === undefined || (Number.isFinite(item.accuracyMeters) && item.accuracyMeters >= 0);
}

export function buildLocationSelection(coordinate: Coordinate, source: LocationSource, extra: Partial<Omit<ActiveLocationSelection, "coordinate" | "source" | "schemaVersion" | "selectedAt">> = {}): ActiveLocationSelection {
  const value: ActiveLocationSelection = { schemaVersion: 1, coordinate: structuredClone(coordinate), source, selectedAt: new Date().toISOString(), ...extra };
  if (!validateLocationSelection(value)) throw new Error("Ubicación inválida");
  return value;
}

export function locationSourceLabel(source: LocationSource): string {
  return { "map-click": "Punto elegido en el mapa", "map-pin": "Pin elegido sobre el mapa", "gps-consented": "GPS autorizado por el usuario", "nominatim-result": "Resultado de búsqueda", "saved-place": "Pin guardado", "manual-coordinate": "Coordenadas ingresadas", "legacy-last-coordinate": "Última ubicación local" }[source];
}

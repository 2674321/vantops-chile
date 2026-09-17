import { isValidCoordinate, validateCoordinate } from "./coordinate";
import type { Coordinate } from "./coordinate";

export interface OperationZone {
  center: Coordinate;
  radiusMeters: number;
}

export const RADIUS_PRESETS_METERS = [500, 1000, 2000] as const;
export type RadiusPresetMeters = (typeof RADIUS_PRESETS_METERS)[number];

/**
 * Límites técnicos de entrada para evitar valores absurdos.
 * No son límites legales ni operacionales.
 */
export const MIN_RADIUS_METERS = 50;
export const MAX_RADIUS_METERS = 50_000;

export const OPERATION_ZONE_DISCLAIMER =
  "La zona representa un área de planificación y no implica autorización para operar dentro de ella.";

export type RadiusValidation = { ok: true } | { ok: false; error: string };

export function formatRadius(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function validateRadiusMeters(value: unknown): RadiusValidation {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, error: "Ingresa un radio numérico." };
  }
  if (value <= 0) {
    return { ok: false, error: "El radio debe ser mayor que cero." };
  }
  if (value < MIN_RADIUS_METERS) {
    return { ok: false, error: `El radio mínimo es ${formatRadius(MIN_RADIUS_METERS)}.` };
  }
  if (value > MAX_RADIUS_METERS) {
    return {
      ok: false,
      error: `El radio máximo permitido por la aplicación es ${formatRadius(MAX_RADIUS_METERS)}.`,
    };
  }
  return { ok: true };
}

export function isValidRadiusMeters(value: unknown): value is number {
  return validateRadiusMeters(value).ok;
}

export function createOperationZone(
  center: Coordinate,
  radiusMeters: number
): OperationZone {
  validateCoordinate(center);
  const validation = validateRadiusMeters(radiusMeters);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  return {
    center: { latitude: center.latitude, longitude: center.longitude },
    radiusMeters,
  };
}

export function isValidOperationZone(value: unknown): value is OperationZone {
  if (typeof value !== "object" || value === null) return false;
  const zone = value as Partial<OperationZone>;
  return (
    typeof zone.center === "object" &&
    zone.center !== null &&
    isValidCoordinate(zone.center as Coordinate) &&
    isValidRadiusMeters(zone.radiusMeters)
  );
}

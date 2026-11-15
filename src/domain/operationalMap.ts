import type { Coordinate } from "./coordinate";
import { isValidCoordinate } from "./coordinate";
import { MAX_RADIUS_METERS, MIN_RADIUS_METERS, validateRadiusMeters } from "./operationZone";

export const OPERATIONAL_MAP_SCHEMA_VERSION = 1 as const;
export const MAX_ZONES_PER_MAP = 50;
export const MAX_OPERATIONAL_MAPS = 100;
export const MAP_ZONE_COLORS = ["#38bdf8", "#22c55e", "#f59e0b", "#f43f5e", "#a78bfa", "#e2e8f0"] as const;

export interface MapRadiusZone {
  id: string;
  name: string;
  center: Coordinate;
  radiusMeters: number;
  color: string;
  visible: boolean;
  fillOpacity: number;
}

export interface SavedOperationalMap {
  id: string;
  schemaVersion: typeof OPERATIONAL_MAP_SCHEMA_VERSION;
  name: string;
  description?: string;
  initialView?: { center: Coordinate; zoom: number };
  zones: MapRadiusZone[];
  createdAt: string;
  updatedAt: string;
}

export interface ZoneMetrics {
  diameterMeters: number;
  areaSquareMeters: number;
  perimeterMeters: number;
}

export function parseStrictRadiusMeters(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:\d+|\d+\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return validateRadiusMeters(parsed).ok ? parsed : null;
}

export function zoneMetrics(radiusMeters: number): ZoneMetrics {
  const validation = validateRadiusMeters(radiusMeters);
  if (!validation.ok) throw new Error(validation.error);
  return {
    diameterMeters: radiusMeters * 2,
    areaSquareMeters: Math.PI * radiusMeters ** 2,
    perimeterMeters: 2 * Math.PI * radiusMeters,
  };
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function haversineDistanceMeters(a: Coordinate, b: Coordinate): number {
  if (!isValidCoordinate(a) || !isValidCoordinate(b)) throw new Error("Coordenadas inválidas.");
  const earthRadius = 6_371_008.8;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function initialBearingDegrees(a: Coordinate, b: Coordinate): number {
  if (!isValidCoordinate(a) || !isValidCoordinate(b)) throw new Error("Coordenadas inválidas.");
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

export function isValidMapRadiusZone(value: unknown): value is MapRadiusZone {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 && value.id.length <= 120
    && typeof value.name === "string" && value.name.trim().length > 0 && value.name.length <= 120
    && isRecord(value.center) && isValidCoordinate(value.center as unknown as Coordinate)
    && validateRadiusMeters(value.radiusMeters).ok
    && typeof value.color === "string" && (MAP_ZONE_COLORS as readonly string[]).includes(value.color)
    && typeof value.visible === "boolean"
    && typeof value.fillOpacity === "number" && Number.isFinite(value.fillOpacity)
    && value.fillOpacity >= 0 && value.fillOpacity <= 0.5;
}

export function isValidSavedOperationalMap(value: unknown): value is SavedOperationalMap {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== OPERATIONAL_MAP_SCHEMA_VERSION) return false;
  if (typeof value.id !== "string" || value.id.length === 0 || value.id.length > 120) return false;
  if (typeof value.name !== "string" || value.name.trim().length === 0 || value.name.length > 120) return false;
  if (value.description !== undefined && (typeof value.description !== "string" || value.description.length > 1000)) return false;
  if (!isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt)) return false;
  if (!Array.isArray(value.zones) || value.zones.length > MAX_ZONES_PER_MAP || !value.zones.every(isValidMapRadiusZone)) return false;
  if (new Set(value.zones.map((zone) => zone.id)).size !== value.zones.length) return false;
  if (value.initialView !== undefined) {
    if (!isRecord(value.initialView) || !isRecord(value.initialView.center)) return false;
    if (!isValidCoordinate(value.initialView.center as unknown as Coordinate)) return false;
    if (typeof value.initialView.zoom !== "number" || !Number.isFinite(value.initialView.zoom) || value.initialView.zoom < 2 || value.initialView.zoom > 19) return false;
  }
  return true;
}

export function operationalMapLimitsDescription(): string {
  return `Radios entre ${MIN_RADIUS_METERS} y ${MAX_RADIUS_METERS} m; hasta ${MAX_ZONES_PER_MAP} zonas por mapa. Límites técnicos, no aeronáuticos.`;
}

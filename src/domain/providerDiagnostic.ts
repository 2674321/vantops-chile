import type { ProviderError } from "./providerError";
import type { ProviderErrorKind } from "./providerError";

/**
 * Registro local limitado de fallas de providers.
 *
 * Propósito: observabilidad local (diagnóstico), NO telemetría. No envía datos
 * a ningún servidor y nunca almacena información personal (sin RUT, nombres,
 * coordenadas, consultas, notas de vuelo ni contenido de bitácora).
 *
 * Almacenamiento: localStorage, lista FIFO con máximo de eventos.
 */

export interface ProviderDiagnosticEntry {
  provider: string;
  kind: ProviderErrorKind;
  timestamp: string;
}

export const DIAGNOSTICS_STORAGE_KEY = "vantops:provider-diagnostics";
export const MAX_DIAGNOSTIC_EVENTS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDiagnostics(raw: unknown): ProviderDiagnosticEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ProviderDiagnosticEntry[] = [];
  for (const item of raw) {
    if (
      isRecord(item) &&
      typeof item.provider === "string" &&
      typeof item.kind === "string" &&
      typeof item.timestamp === "string"
    ) {
      entries.push({
        provider: item.provider,
        kind: item.kind as ProviderErrorKind,
        timestamp: item.timestamp,
      });
    }
  }
  return entries;
}

export function readDiagnostics(): ProviderDiagnosticEntry[] {
  try {
    const raw = localStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
    if (!raw) return [];
    return parseDiagnostics(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeDiagnostics(entries: ProviderDiagnosticEntry[]): void {
  try {
    const tail = entries.slice(-MAX_DIAGNOSTIC_EVENTS);
    localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(tail));
  } catch {
    // localStorage no disponible (modo privado, tests node): ignorar.
  }
}

export function recordProviderFailure(
  provider: string,
  kind: ProviderErrorKind,
  now: Date = new Date()
): ProviderDiagnosticEntry {
  const entry: ProviderDiagnosticEntry = {
    provider,
    kind,
    timestamp: now.toISOString(),
  };
  const current = readDiagnostics();
  const updated = [...current, entry].slice(-MAX_DIAGNOSTIC_EVENTS);
  writeDiagnostics(updated);
  return entry;
}

export function clearDiagnostics(): void {
  try {
    localStorage.removeItem(DIAGNOSTICS_STORAGE_KEY);
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}

/**
 * Registra la falla y devuelve el mismo error, de modo que los providers la
 * registren al lanzar sin cambiar su semántica:
 *
 *   throw recordProviderError(new WeatherError(...));
 */
export function recordProviderError(error: ProviderError): ProviderError {
  recordProviderFailure(error.provider, error.kind);
  return error;
}
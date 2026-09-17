import type { FlightRecord } from "../domain/logbook/types";
import { OPERATION_TYPE_LABELS, INCIDENT_TYPE_LABELS } from "../domain/logbook/types";

export const CSV_BOM = "\uFEFF";

export function escapeCsvField(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\r\n]/.test(value) ? `"${escaped}"` : escaped;
}

export function toCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map((field) => escapeCsvField(field == null ? "" : String(field))).join(",");
}

export const FLIGHT_CSV_HEADERS = [
  "Fecha inicio",
  "Hora inicio",
  "Fecha fin",
  "Hora fin",
  "Duracion (min)",
  "Tipo de operacion",
  "Aeronave",
  "Fabricante",
  "Modelo",
  "Tipo",
  "Latitud",
  "Longitud",
  "Elevacion (m)",
  "Bateria inicio (%)",
  "Bateria fin (%)",
  "Incidentes",
  "Notas",
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function splitDateTime(iso?: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

function formatDuration(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds)) return "";
  return (Math.round((seconds / 60) * 10) / 10).toString();
}

function formatIncidents(flight: FlightRecord): string {
  if (!flight.incidents?.length) return "";
  return flight.incidents
    .map((incident) => {
      const label = INCIDENT_TYPE_LABELS[incident.type] ?? incident.type;
      return incident.notes ? `${label}: ${incident.notes}` : label;
    })
    .join("; ");
}

export function flightToCsvRow(flight: FlightRecord): string {
  const start = splitDateTime(flight.startedAt);
  const end = splitDateTime(flight.endedAt);
  const aircraft = flight.aircraftSnapshot;
  return toCsvRow([
    start.date,
    start.time,
    end.date,
    end.time,
    formatDuration(flight.durationSeconds),
    flight.operationType ? OPERATION_TYPE_LABELS[flight.operationType] : "",
    aircraft?.name,
    aircraft?.manufacturer,
    aircraft?.model,
    aircraft?.type,
    flight.coordinate.latitude,
    flight.coordinate.longitude,
    flight.elevation,
    flight.batteryStartPct,
    flight.batteryEndPct,
    formatIncidents(flight),
    flight.notes,
  ]);
}

export function flightsToCsv(flights: FlightRecord[]): string {
  const lines = [toCsvRow([...FLIGHT_CSV_HEADERS]), ...flights.map(flightToCsvRow)];
  return `${CSV_BOM}${lines.join("\r\n")}\r\n`;
}

import { isValidCoordinate } from "../coordinate";
import { validateLocationSelection } from "../locationSelection";
import { MAX_FLIGHTS_PER_SESSION, MAX_OPERATION_NOTES_LENGTH, type FlightRun, type OperationSession } from "./types";

const SESSION_STATUSES = new Set(["ACTIVE", "COMPLETED", "CANCELLED"]);
const FLIGHT_STATUSES = new Set(["IN_FLIGHT", "LANDED", "INTERRUPTED"]);

function timestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

export function sessionDurationSeconds(session: Pick<OperationSession, "startedAt" | "endedAt">, nowIso: string): number {
  const start = Date.parse(session.startedAt);
  const end = Date.parse(session.endedAt ?? nowIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error("Intervalo operacional inválido");
  return Math.floor((end - start) / 1000);
}

/**
 * Duración visible del cronómetro. En el primer render `now` puede quedar unos
 * milisegundos por detrás de `startedAt` (carrera del reloj); la presentación se
 * fija en 0 sin relajar la validación de dominio, que sigue rechazando
 * intervalos verdaderamente negativos.
 */
export function visibleSessionSeconds(session: Pick<OperationSession, "startedAt" | "endedAt">, nowIso: string): number {
  return sessionDurationSeconds(session, Date.parse(nowIso) < Date.parse(session.startedAt) ? session.startedAt : nowIso);
}

export function flightDurationSeconds(flight: Pick<FlightRun, "startedAt" | "endedAt">): number {
  if (!flight.endedAt) throw new Error("Vuelo sin cierre registrado");
  const start = Date.parse(flight.startedAt);
  const end = Date.parse(flight.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error("Intervalo de vuelo inválido");
  return Math.floor((end - start) / 1000);
}

export function totalFlightSeconds(session: OperationSession): number {
  return session.flights.filter((flight) => flight.status === "LANDED").reduce((sum, flight) => sum + flightDurationSeconds(flight), 0);
}

export function activeFlightRun(session: OperationSession): FlightRun | null {
  return session.flights.find((flight) => flight.status === "IN_FLIGHT") ?? null;
}

export function canStartFlight(session: OperationSession): boolean {
  return session.status === "ACTIVE" && !activeFlightRun(session) && session.flights.length < MAX_FLIGHTS_PER_SESSION;
}

export function canCompleteSession(session: OperationSession): boolean {
  return session.status === "ACTIVE" && !activeFlightRun(session);
}

export function validateOperationSession(value: unknown): value is OperationSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const session = value as Partial<OperationSession>;
  if (session.schemaVersion !== 1 || typeof session.id !== "string" || !session.id) return false;
  if (typeof session.status !== "string" || !SESSION_STATUSES.has(session.status)) return false;
  if (!timestamp(session.startedAt) || !timestamp(session.createdAt) || !timestamp(session.updatedAt)) return false;
  if (session.endedAt !== undefined && (!timestamp(session.endedAt) || Date.parse(session.endedAt) < Date.parse(session.startedAt))) return false;
  if (!validateLocationSelection(session.locationSnapshot) || !isValidCoordinate(session.locationSnapshot.coordinate)) return false;
  if (!Array.isArray(session.flights) || session.flights.length > MAX_FLIGHTS_PER_SESSION) return false;
  if (session.notes !== undefined && (typeof session.notes !== "string" || session.notes.length > MAX_OPERATION_NOTES_LENGTH)) return false;
  if (typeof session.startCommandId !== "string" || !session.startCommandId) return false;
  let activeCount = 0;
  for (const flight of session.flights) {
    if (!flight || typeof flight !== "object" || typeof flight.id !== "string" || !flight.id) return false;
    if (!FLIGHT_STATUSES.has(flight.status) || !timestamp(flight.startedAt) || typeof flight.startCommandId !== "string" || !flight.startCommandId) return false;
    if (flight.status === "IN_FLIGHT") activeCount++;
    if (flight.status === "LANDED" && (!timestamp(flight.endedAt) || !flight.flightRecordId)) return false;
    if (flight.endedAt !== undefined && (!timestamp(flight.endedAt) || Date.parse(flight.endedAt) < Date.parse(flight.startedAt))) return false;
    if (flight.notes !== undefined && (typeof flight.notes !== "string" || flight.notes.length > MAX_OPERATION_NOTES_LENGTH)) return false;
  }
  if (activeCount > 1 || (session.status !== "ACTIVE" && activeCount > 0)) return false;
  return session.status === "ACTIVE" ? session.endedAt === undefined : session.endedAt !== undefined;
}

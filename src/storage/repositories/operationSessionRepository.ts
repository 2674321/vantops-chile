import type { ActiveLocationSelection } from "../../domain/locationSelection";
import type { AircraftSnapshot, FlightRecord, OperationType } from "../../domain/logbook/types";
import { activeFlightRun, canCompleteSession, canStartFlight, flightDurationSeconds, validateOperationSession } from "../../domain/operations/logic";
import { MAX_OPERATION_NOTES_LENGTH, type OperationSession } from "../../domain/operations/types";
import { createLocalId } from "../../lib/id";
import { getDB } from "../db";

export const ACTIVE_OPERATION_SETTING_ID = "activeOperationSessionId";
export const OPERATION_CHANGED_EVENT = "vantops:operation-session";

export class OperationCommandError extends Error {
  constructor(message: string) { super(message); this.name = "OperationCommandError"; }
}

interface StartOperationInput {
  commandId: string;
  locationSnapshot: ActiveLocationSelection;
  planId?: string;
  mapId?: string;
  zoneId?: string;
  aircraftSnapshot?: AircraftSnapshot;
  operationType?: OperationType;
  nowIso?: string;
}

interface StartFlightInput {
  commandId: string;
  aircraftSnapshot: AircraftSnapshot;
  batteryId?: string;
  batteryStartPct?: number;
  notes?: string;
  nowIso?: string;
}

interface FinishFlightInput {
  commandId: string;
  endedAt?: string;
  manualCorrection?: boolean;
  batteryEndPct?: number;
  notes?: string;
}

function assertTimestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new OperationCommandError(`${label} inválida.`);
}

function assertPercent(value: number | undefined): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) throw new OperationCommandError("El porcentaje de batería debe estar entre 0 y 100.");
}

function publishChange(session?: OperationSession): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPERATION_CHANGED_EVENT, { detail: session?.id }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(OPERATION_CHANGED_EVENT);
    channel.postMessage({ sessionId: session?.id });
    channel.close();
  }
}

async function sentinelId(): Promise<string | null> {
  const record = await getDB().settings.get(ACTIVE_OPERATION_SETTING_ID);
  if (!record) return null;
  try { const value = JSON.parse(record.value); return typeof value === "string" && value ? value : null; } catch { return null; }
}

export async function getOperationSession(id: string): Promise<OperationSession | undefined> {
  return getDB().operationSessions.get(id);
}

export async function listOperationSessions(limit = 50): Promise<OperationSession[]> {
  return getDB().operationSessions.orderBy("startedAt").reverse().limit(limit).toArray();
}

export async function loadActiveOperationSession(): Promise<OperationSession | null> {
  const db = getDB();
  const id = await sentinelId();
  const pointed = id ? await db.operationSessions.get(id) : undefined;
  if (pointed?.status === "ACTIVE") return pointed;
  const active = await db.operationSessions.where("status").equals("ACTIVE").first();
  if (active) {
    await db.settings.put({ id: ACTIVE_OPERATION_SETTING_ID, value: JSON.stringify(active.id), updatedAt: new Date().toISOString() });
    return active;
  }
  if (id) await db.settings.delete(ACTIVE_OPERATION_SETTING_ID);
  return null;
}

export async function startOperation(input: StartOperationInput): Promise<OperationSession> {
  if (!input.commandId || !validateLocationSelectionForCommand(input.locationSnapshot)) throw new OperationCommandError("Selecciona una ubicación válida antes de iniciar.");
  const db = getDB();
  const now = input.nowIso ?? new Date().toISOString();
  assertTimestamp(now, "Hora de inicio");
  let result!: OperationSession;
  await db.transaction("rw", [db.operationSessions, db.settings], async () => {
    const storedSentinel = await db.settings.get(ACTIVE_OPERATION_SETTING_ID);
    let existing: OperationSession | undefined;
    if (storedSentinel) {
      try { const id = JSON.parse(storedSentinel.value); if (typeof id === "string") existing = await db.operationSessions.get(id); } catch { /* stale sentinel */ }
    }
    existing = existing?.status === "ACTIVE" ? existing : await db.operationSessions.where("status").equals("ACTIVE").first();
    if (existing) {
      if (existing.startCommandId === input.commandId) { result = existing; return; }
      throw new OperationCommandError("Ya existe una operación activa en este dispositivo.");
    }
    const session: OperationSession = {
      id: createLocalId(), schemaVersion: 1, status: "ACTIVE", planId: input.planId, mapId: input.mapId, zoneId: input.zoneId,
      locationSnapshot: structuredClone(input.locationSnapshot), aircraftSnapshot: input.aircraftSnapshot ? structuredClone(input.aircraftSnapshot) : undefined,
      operationType: input.operationType, startedAt: now, flights: [], startCommandId: input.commandId, createdAt: now, updatedAt: now,
    };
    if (!validateOperationSession(session)) throw new OperationCommandError("La sesión no cumple el contrato de datos.");
    await db.operationSessions.add(session);
    await db.settings.put({ id: ACTIVE_OPERATION_SETTING_ID, value: JSON.stringify(session.id), updatedAt: now });
    result = session;
  });
  publishChange(result);
  return result;
}

function validateLocationSelectionForCommand(value: ActiveLocationSelection): boolean {
  return Boolean(value && value.schemaVersion === 1 && Number.isFinite(value.coordinate?.latitude) && Number.isFinite(value.coordinate?.longitude) && Math.abs(value.coordinate.latitude) <= 90 && Math.abs(value.coordinate.longitude) <= 180);
}

export async function startFlight(sessionId: string, input: StartFlightInput): Promise<OperationSession> {
  if (!input.commandId || !input.aircraftSnapshot?.id || !input.aircraftSnapshot.name) throw new OperationCommandError("Selecciona una aeronave antes de iniciar el vuelo.");
  assertPercent(input.batteryStartPct);
  const db = getDB();
  const now = input.nowIso ?? new Date().toISOString();
  assertTimestamp(now, "Hora de vuelo");
  let result!: OperationSession;
  await db.transaction("rw", db.operationSessions, async () => {
    const session = await db.operationSessions.get(sessionId);
    if (!session || session.status !== "ACTIVE") throw new OperationCommandError("No existe una operación activa.");
    const repeated = session.flights.find((run) => run.startCommandId === input.commandId);
    if (repeated) { result = session; return; }
    if (!canStartFlight(session)) throw new OperationCommandError("Ya hay un vuelo pendiente de cierre.");
    if (Date.parse(now) < Date.parse(session.startedAt)) throw new OperationCommandError("El vuelo no puede comenzar antes que la operación.");
    const next: OperationSession = { ...session, aircraftSnapshot: structuredClone(input.aircraftSnapshot), flights: [...session.flights, {
      id: createLocalId(), status: "IN_FLIGHT", startedAt: now, aircraftSnapshot: structuredClone(input.aircraftSnapshot), batteryId: input.batteryId,
      batteryStartPct: input.batteryStartPct, notes: input.notes?.slice(0, MAX_OPERATION_NOTES_LENGTH) || undefined, timeSource: "DEVICE_USER_ACTION", startCommandId: input.commandId,
    }], updatedAt: now };
    await db.operationSessions.put(next); result = next;
  });
  publishChange(result); return result;
}

export async function finishFlight(sessionId: string, input: FinishFlightInput): Promise<OperationSession> {
  if (!input.commandId) throw new OperationCommandError("Comando de cierre inválido.");
  assertPercent(input.batteryEndPct);
  const db = getDB();
  const end = input.endedAt ?? new Date().toISOString();
  assertTimestamp(end, "Hora de aterrizaje");
  let result!: OperationSession;
  await db.transaction("rw", [db.operationSessions, db.flights, db.plans], async () => {
    const session = await db.operationSessions.get(sessionId);
    if (!session || session.status !== "ACTIVE") throw new OperationCommandError("No existe una operación activa.");
    const repeated = session.flights.find((run) => run.finishCommandId === input.commandId);
    if (repeated) { result = session; return; }
    const run = activeFlightRun(session);
    if (!run) throw new OperationCommandError("No hay un vuelo iniciado pendiente de aterrizaje.");
    const durationSeconds = flightDurationSeconds({ startedAt: run.startedAt, endedAt: end });
    const flightRecordId = createLocalId();
    const plan = session.planId ? await db.plans.get(session.planId) : undefined;
    const now = new Date().toISOString();
    const flight: FlightRecord = {
      id: flightRecordId, startedAt: run.startedAt, endedAt: end, durationSeconds, coordinate: structuredClone(session.locationSnapshot.coordinate),
      aircraftId: run.aircraftSnapshot?.id, aircraftSnapshot: run.aircraftSnapshot ? structuredClone(run.aircraftSnapshot) : undefined,
      batteryId: run.batteryId, batteryStartPct: run.batteryStartPct, batteryEndPct: input.batteryEndPct,
      operationType: session.operationType, notes: input.notes?.slice(0, MAX_OPERATION_NOTES_LENGTH) || run.notes,
      planId: session.planId, operationSessionId: session.id, weatherSnapshot: plan?.weatherSnapshot, observationSnapshot: plan?.observationSnapshot,
      assessmentSnapshot: plan?.assessmentSnapshot, checklistSnapshot: plan?.checklistSnapshot, createdAt: now, updatedAt: now,
    };
    await db.flights.add(flight);
    const nextFlights = session.flights.map((item) => item.id === run.id ? { ...item, status: "LANDED" as const, endedAt: end, flightRecordId, batteryEndPct: input.batteryEndPct, notes: flight.notes, timeSource: input.manualCorrection ? "MANUAL_CORRECTION" as const : item.timeSource, finishCommandId: input.commandId } : item);
    const next = { ...session, flights: nextFlights, updatedAt: now };
    await db.operationSessions.put(next);
    if (plan && !plan.linkedFlightId) await db.plans.update(plan.id, { linkedFlightId: flightRecordId, updatedAt: now });
    result = next;
  });
  publishChange(result); return result;
}

export async function interruptFlight(sessionId: string, notes: string, endedAt = new Date().toISOString()): Promise<OperationSession> {
  const db = getDB(); assertTimestamp(endedAt, "Hora de interrupción"); let result!: OperationSession;
  await db.transaction("rw", db.operationSessions, async () => {
    const session = await db.operationSessions.get(sessionId); if (!session || session.status !== "ACTIVE") throw new OperationCommandError("No existe una operación activa.");
    const run = activeFlightRun(session); if (!run) throw new OperationCommandError("No hay vuelo pendiente.");
    if (!notes.trim()) throw new OperationCommandError("Describe por qué el registro quedó interrumpido.");
    if (Date.parse(endedAt) < Date.parse(run.startedAt)) throw new OperationCommandError("La interrupción no puede ser anterior al inicio del vuelo.");
    const next = { ...session, flights: session.flights.map((item) => item.id === run.id ? { ...item, status: "INTERRUPTED" as const, endedAt, notes: notes.trim().slice(0, MAX_OPERATION_NOTES_LENGTH) } : item), updatedAt: endedAt };
    await db.operationSessions.put(next); result = next;
  });
  publishChange(result); return result;
}

export async function completeOperation(sessionId: string, commandId: string, endedAt = new Date().toISOString()): Promise<OperationSession> {
  const db = getDB(); assertTimestamp(endedAt, "Hora de cierre"); let result!: OperationSession;
  await db.transaction("rw", [db.operationSessions, db.settings], async () => {
    const session = await db.operationSessions.get(sessionId); if (!session) throw new OperationCommandError("Operación no encontrada.");
    if (session.status === "COMPLETED" && session.completeCommandId === commandId) { result = session; return; }
    if (!canCompleteSession(session)) throw new OperationCommandError("Finaliza o interrumpe el vuelo activo antes de cerrar la operación.");
    if (Date.parse(endedAt) < Date.parse(session.startedAt)) throw new OperationCommandError("El cierre no puede ser anterior al inicio.");
    const next: OperationSession = { ...session, status: "COMPLETED", endedAt, completeCommandId: commandId, updatedAt: endedAt };
    await db.operationSessions.put(next); await db.settings.delete(ACTIVE_OPERATION_SETTING_ID); result = next;
  });
  publishChange(result); return result;
}

export async function cancelOperation(sessionId: string, reason = "", endedAt = new Date().toISOString()): Promise<OperationSession> {
  const db = getDB(); assertTimestamp(endedAt, "Hora de cancelación"); let result!: OperationSession;
  await db.transaction("rw", [db.operationSessions, db.settings], async () => {
    const session = await db.operationSessions.get(sessionId); if (!session || session.status !== "ACTIVE") throw new OperationCommandError("Operación no encontrada.");
    if (session.flights.length > 0) throw new OperationCommandError("Una operación con vuelos debe finalizarse, no cancelarse.");
    if (Date.parse(endedAt) < Date.parse(session.startedAt)) throw new OperationCommandError("La cancelación no puede ser anterior al inicio.");
    const next: OperationSession = { ...session, status: "CANCELLED", endedAt, cancellationReason: reason.trim().slice(0, MAX_OPERATION_NOTES_LENGTH) || undefined, updatedAt: endedAt };
    await db.operationSessions.put(next); await db.settings.delete(ACTIVE_OPERATION_SETTING_ID); result = next;
  });
  publishChange(result); return result;
}

export async function updateOperationNotes(sessionId: string, notes: string): Promise<OperationSession> {
  const db = getDB(); const session = await db.operationSessions.get(sessionId); if (!session) throw new OperationCommandError("Operación no encontrada.");
  const next = { ...session, notes: notes.trim().slice(0, MAX_OPERATION_NOTES_LENGTH) || undefined, updatedAt: new Date().toISOString() };
  await db.operationSessions.put(next); publishChange(next); return next;
}

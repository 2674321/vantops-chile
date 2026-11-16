import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { buildLocationSelection } from "../../domain/locationSelection";
import { totalFlightSeconds } from "../../domain/operations/logic";
import { getDB, resetDB } from "../db";
import { completeOperation, finishFlight, interruptFlight, listOperationSessions, loadActiveOperationSession, startFlight, startOperation } from "./operationSessionRepository";

const location = buildLocationSelection({ latitude: -33.45, longitude: -70.65 }, "map-click", { label: "Lugar sintético" });
const aircraft = { id: "aircraft-1", name: "Aeronave de prueba", model: "Sintética" };

beforeEach(async () => {
  resetDB();
  const db = getDB();
  await db.operationSessions.clear(); await db.flights.clear(); await db.settings.clear(); await db.plans.clear();
});

describe("operation session repository", () => {
  it("creates one durable active session and rejects a competing start", async () => {
    const first = await startOperation({ commandId: "start-1", locationSnapshot: location, nowIso: "2026-11-16T10:00:00.000Z" });
    expect((await loadActiveOperationSession())?.id).toBe(first.id);
    await expect(startOperation({ commandId: "start-2", locationSnapshot: location })).rejects.toThrow(/Ya existe/);
    expect(await listOperationSessions()).toHaveLength(1);
  });

  it("completes an operation with zero flights without creating a ghost flight", async () => {
    const session = await startOperation({ commandId: "start", locationSnapshot: location, nowIso: "2026-11-16T10:00:00.000Z" });
    const closed = await completeOperation(session.id, "close", "2026-11-16T10:20:00.000Z");
    expect(closed).toMatchObject({ status: "COMPLETED", flights: [] });
    expect(await getDB().flights.count()).toBe(0);
    expect(await loadActiveOperationSession()).toBeNull();
  });

  it("records two independent flights, preserves the first legacy plan link and sums flight time", async () => {
    const now = "2026-11-16T10:00:00.000Z";
    await getDB().plans.add({ id: "plan-1", schemaVersion: 1, createdAt: now, updatedAt: now, location: location.coordinate, status: "REVIEWED" });
    let session = await startOperation({ commandId: "start", locationSnapshot: location, planId: "plan-1", aircraftSnapshot: aircraft, nowIso: now });
    session = await startFlight(session.id, { commandId: "flight-1-start", aircraftSnapshot: aircraft, nowIso: "2026-11-16T10:05:00.000Z" });
    session = await finishFlight(session.id, { commandId: "flight-1-end", endedAt: "2026-11-16T10:15:00.000Z" });
    const firstId = session.flights[0].flightRecordId;
    session = await startFlight(session.id, { commandId: "flight-2-start", aircraftSnapshot: aircraft, nowIso: "2026-11-16T10:20:00.000Z" });
    session = await finishFlight(session.id, { commandId: "flight-2-end", endedAt: "2026-11-16T10:35:00.000Z" });
    expect(session.flights.map((run) => run.flightRecordId)).toHaveLength(2);
    expect(new Set(session.flights.map((run) => run.flightRecordId)).size).toBe(2);
    expect(totalFlightSeconds(session)).toBe(25 * 60);
    expect(await getDB().flights.where("operationSessionId").equals(session.id).count()).toBe(2);
    expect((await getDB().plans.get("plan-1"))?.linkedFlightId).toBe(firstId);
  });

  it("restores an in-flight run and does not invent an end time", async () => {
    let session = await startOperation({ commandId: "start", locationSnapshot: location, aircraftSnapshot: aircraft, nowIso: "2026-11-16T09:30:00.000Z" });
    session = await startFlight(session.id, { commandId: "flight-start", aircraftSnapshot: aircraft, nowIso: "2026-11-16T10:00:00.000Z" });
    resetDB();
    const recovered = await loadActiveOperationSession();
    expect(recovered?.flights[0]).toMatchObject({ status: "IN_FLIGHT" });
    expect(recovered?.flights[0]).not.toHaveProperty("endedAt");
    expect(recovered?.flights[0]).not.toHaveProperty("flightRecordId");
    const interrupted = await interruptFlight(session.id, "No se conoce la hora real de aterrizaje", "2026-11-16T10:30:00.000Z");
    expect(interrupted.flights[0]).toMatchObject({ status: "INTERRUPTED" });
    expect(interrupted.flights[0]).not.toHaveProperty("flightRecordId");
    expect(await getDB().flights.count()).toBe(0);
  });

  it("rejects an end before takeoff and leaves the run active", async () => {
    let session = await startOperation({ commandId: "start", locationSnapshot: location, aircraftSnapshot: aircraft, nowIso: "2026-11-16T09:30:00.000Z" });
    session = await startFlight(session.id, { commandId: "flight-start", aircraftSnapshot: aircraft, nowIso: "2026-11-16T10:00:00.000Z" });
    await expect(finishFlight(session.id, { commandId: "bad-end", endedAt: "2026-11-16T09:59:00.000Z" })).rejects.toThrow(/Intervalo/);
    expect((await loadActiveOperationSession())?.flights[0].status).toBe("IN_FLIGHT");
    expect(await getDB().flights.count()).toBe(0);
  });

  it("makes a repeated finish command idempotent and records a manual correction source", async () => {
    let session = await startOperation({ commandId: "start", locationSnapshot: location, aircraftSnapshot: aircraft, nowIso: "2026-11-16T10:00:00.000Z" });
    session = await startFlight(session.id, { commandId: "flight-start", aircraftSnapshot: aircraft, nowIso: "2026-11-16T10:05:00.000Z" });
    const first = await finishFlight(session.id, { commandId: "same-finish", endedAt: "2026-11-16T10:15:00.000Z", manualCorrection: true });
    const repeated = await finishFlight(session.id, { commandId: "same-finish", endedAt: "2026-11-16T10:20:00.000Z" });
    expect(await getDB().flights.count()).toBe(1);
    expect(repeated.flights[0]).toEqual(first.flights[0]);
    expect(first.flights[0].timeSource).toBe("MANUAL_CORRECTION");
  });
});

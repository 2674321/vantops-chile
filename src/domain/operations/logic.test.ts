import { describe, expect, it } from "vitest";
import { activeFlightRun, canCompleteSession, canStartFlight, flightDurationSeconds, sessionDurationSeconds, totalFlightSeconds, validateOperationSession, visibleSessionSeconds } from "./logic";
import type { OperationSession } from "./types";

const base: OperationSession = {
  id: "session-1", schemaVersion: 1, status: "ACTIVE", startCommandId: "cmd-start",
  locationSnapshot: { schemaVersion: 1, coordinate: { latitude: 0, longitude: 0 }, source: "map-click", selectedAt: "2026-11-16T10:00:00.000Z" },
  startedAt: "2026-11-16T10:00:00.000Z", flights: [], createdAt: "2026-11-16T10:00:00.000Z", updatedAt: "2026-11-16T10:00:00.000Z",
};

describe("operation session domain", () => {
  it("accepts explicit 0,0 and a session with zero flights", () => {
    expect(validateOperationSession(base)).toBe(true);
    expect(canStartFlight(base)).toBe(true);
    expect(canCompleteSession(base)).toBe(true);
  });

  it("separates operation duration from summed landed flight time", () => {
    const session: OperationSession = { ...base, status: "COMPLETED", endedAt: "2026-11-16T11:12:00.000Z", flights: [
      { id: "run-1", status: "LANDED", startedAt: "2026-11-16T10:10:00.000Z", endedAt: "2026-11-16T10:21:00.000Z", flightRecordId: "f1", timeSource: "DEVICE_USER_ACTION", startCommandId: "s1", finishCommandId: "e1" },
      { id: "run-2", status: "LANDED", startedAt: "2026-11-16T10:30:00.000Z", endedAt: "2026-11-16T10:44:00.000Z", flightRecordId: "f2", timeSource: "DEVICE_USER_ACTION", startCommandId: "s2", finishCommandId: "e2" },
    ] };
    expect(sessionDurationSeconds(session, "2026-11-16T11:12:00.000Z")).toBe(72 * 60);
    expect(totalFlightSeconds(session)).toBe(25 * 60);
  });

  it("rejects negative intervals and blocks completion with an active flight", () => {
    expect(() => flightDurationSeconds({ startedAt: "2026-11-16T11:00:00Z", endedAt: "2026-11-16T10:00:00Z" })).toThrow();
    const session: OperationSession = { ...base, flights: [{ id: "run", status: "IN_FLIGHT", startedAt: base.startedAt, timeSource: "DEVICE_USER_ACTION", startCommandId: "cmd" }] };
    expect(activeFlightRun(session)?.id).toBe("run");
    expect(canStartFlight(session)).toBe(false);
    expect(canCompleteSession(session)).toBe(false);
  });

  it("clamps the first-render timer race to zero while the domain still rejects negative intervals", () => {
    expect(() => sessionDurationSeconds(base, "2026-11-16T09:59:59.990Z")).toThrow();
    expect(visibleSessionSeconds(base, "2026-11-16T09:59:59.990Z")).toBe(0);
    expect(visibleSessionSeconds(base, "2026-11-16T10:00:01.000Z")).toBe(1);
  });
});

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDB, resetDB } from "../db";
import { createFlight, deleteFlight, getFlight, updateFlight } from "./flightRepository";
import {
  createFlightPlan,
  deleteFlightPlan,
  duplicateFlightPlan,
  getFlightPlan,
  listFlightPlans,
  updateFlightPlan,
} from "./flightPlanRepository";

beforeEach(async () => {
  resetDB();
  await getDB().delete();
  resetDB();
});

describe("flightPlanRepository", () => {
  it("creates, updates and lists a local plan", async () => {
    const plan = await createFlightPlan({
      location: { latitude: -33.45, longitude: -70.65 },
      locationLabel: "Santiago",
      status: "DRAFT",
    });
    expect(plan.id).toBeTruthy();
    expect(plan.schemaVersion).toBe(1);

    await updateFlightPlan(plan.id, { status: "REVIEWED" });
    expect(await getFlightPlan(plan.id)).toMatchObject({ status: "REVIEWED" });
    expect(await listFlightPlans()).toHaveLength(1);
  });

  it("duplicates without reusing identity or flight linkage", async () => {
    const source = await createFlightPlan({
      location: { latitude: -33.45, longitude: -70.65 },
      locationLabel: "Club",
      status: "REVIEWED",
      linkedFlightId: "flight-1",
    });
    const copy = await duplicateFlightPlan(source.id);
    expect(copy.id).not.toBe(source.id);
    expect(copy.status).toBe("DRAFT");
    expect(copy.linkedFlightId).toBeUndefined();
    expect(copy.locationLabel).toBe("Club (copia)");
  });

  it("hides archived plans by default", async () => {
    const plan = await createFlightPlan({
      location: { latitude: -33.45, longitude: -70.65 },
      status: "ARCHIVED",
    });
    expect(await listFlightPlans()).toEqual([]);
    expect(await listFlightPlans(true)).toEqual([plan]);
  });

  it("preserves a plan linked from a flight", async () => {
    const plan = await createFlightPlan({
      location: { latitude: -33.45, longitude: -70.65 },
      status: "REVIEWED",
    });
    await createFlight({
      coordinate: plan.location,
      planId: plan.id,
    });
    await expect(deleteFlightPlan(plan.id)).rejects.toThrow(/vinculado/);
    expect(await getFlightPlan(plan.id)).toBeDefined();
  });

  it("unlinks but preserves the plan when its flight is deleted", async () => {
    const plan = await createFlightPlan({
      location: { latitude: -33.45, longitude: -70.65 },
      status: "REVIEWED",
    });
    const flight = await createFlight({ coordinate: plan.location, planId: plan.id });
    await updateFlightPlan(plan.id, { linkedFlightId: flight.id });

    await deleteFlight(flight.id);
    expect(await getFlightPlan(plan.id)).toMatchObject({ id: plan.id });
    expect((await getFlightPlan(plan.id))?.linkedFlightId).toBeUndefined();
  });

  it("editing personal notes does not rewrite historical snapshots", async () => {
    const flight = await createFlight({
      coordinate: { latitude: -33.45, longitude: -70.65 },
      assessmentSnapshot: {
        status: "CAUTION",
        reasons: [],
        evaluatedAt: "2026-11-14T10:00:00Z",
        missingData: ["ráfagas"],
        capturedAt: "2026-11-14T10:00:00Z",
      },
    });
    await updateFlight(flight.id, { notes: "nota posterior" });
    expect(await getFlight(flight.id)).toMatchObject({
      notes: "nota posterior",
      assessmentSnapshot: {
        status: "CAUTION",
        capturedAt: "2026-11-14T10:00:00Z",
      },
    });
  });
});

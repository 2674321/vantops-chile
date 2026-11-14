import type { FlightPlan } from "../../domain/flightPlan/types";
import { createLocalId } from "../../lib/id";
import { getDB } from "../db";

type NewFlightPlan = Omit<FlightPlan, "id" | "schemaVersion" | "createdAt" | "updatedAt">;

export async function createFlightPlan(data: NewFlightPlan): Promise<FlightPlan> {
  const now = new Date().toISOString();
  const plan: FlightPlan = {
    ...data,
    id: createLocalId(),
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  await getDB().plans.add(plan);
  return plan;
}

export async function getFlightPlan(id: string): Promise<FlightPlan | undefined> {
  return getDB().plans.get(id);
}

export async function listFlightPlans(includeArchived = false): Promise<FlightPlan[]> {
  const plans = await getDB().plans.orderBy("updatedAt").reverse().toArray();
  return includeArchived ? plans : plans.filter((plan) => plan.status !== "ARCHIVED");
}

export async function updateFlightPlan(
  id: string,
  changes: Partial<Omit<FlightPlan, "id" | "createdAt" | "schemaVersion">>
): Promise<void> {
  await getDB().plans.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export async function duplicateFlightPlan(id: string): Promise<FlightPlan> {
  const source = await getFlightPlan(id);
  if (!source) throw new Error("Plan no encontrado");
  const {
    id: _id,
    schemaVersion: _schemaVersion,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    linkedFlightId: _linkedFlightId,
    ...copy
  } = source;
  return createFlightPlan({
    ...copy,
    status: "DRAFT",
    locationLabel: copy.locationLabel ? `${copy.locationLabel} (copia)` : undefined,
  });
}

export async function deleteFlightPlan(id: string): Promise<void> {
  const db = getDB();
  const linkedFlight = await db.flights.where("planId").equals(id).first();
  if (linkedFlight) {
    throw new Error("No se puede eliminar un plan vinculado a un vuelo; archívalo.");
  }
  await db.plans.delete(id);
}

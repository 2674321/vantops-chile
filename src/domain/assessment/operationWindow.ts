import type { HourlyWeather } from "../weather";
import type { FlightLimits } from "./limits";
import type { AssessmentStatus } from "./types";
import { hasAnyLimit } from "./limits";
import { evaluateHour } from "./hourly";

export type OperationWindowKind =
  | "ok"
  | "no-favorable"
  | "needs-limits"
  | "insufficient-data";

export interface HourlySlot {
  timeISO: string;
  status: AssessmentStatus;
}

export interface OperationWindow {
  kind: OperationWindowKind;
  bestStatus: AssessmentStatus | null;
  startISO: string | null;
  endISO: string | null;
  slots: HourlySlot[];
}

export interface OperationWindowOptions {
  now?: Date;
  maxSlots?: number;
}

const DEFAULT_MAX_SLOTS = 24;

const STATUS_RANK: Record<AssessmentStatus, number> = {
  FAVORABLE: 0,
  CAUTION: 1,
  UNFAVORABLE: 2,
  NO_DATA: 3,
};

export function statusRank(status: AssessmentStatus): number {
  return STATUS_RANK[status];
}

function futureHours(hours: HourlyWeather[], now: Date): HourlyWeather[] {
  const threshold = now.getTime();
  return hours.filter((hour) => {
    const t = new Date(hour.timeISO).getTime();
    return Number.isFinite(t) && t >= threshold;
  });
}

/**
 * Devuelve la mejor franja estimada según los parámetros configurados.
 * El resultado es orientativo y no constituye una autorización de vuelo.
 */
export function findOperationWindow(
  hours: HourlyWeather[],
  limits: FlightLimits,
  options: OperationWindowOptions = {}
): OperationWindow {
  if (!hasAnyLimit(limits)) {
    return {
      kind: "needs-limits",
      bestStatus: null,
      startISO: null,
      endISO: null,
      slots: [],
    };
  }

  const maxSlots = options.maxSlots ?? DEFAULT_MAX_SLOTS;
  const upcoming = futureHours(hours, options.now ?? new Date()).slice(0, maxSlots);

  if (upcoming.length === 0) {
    return {
      kind: "insufficient-data",
      bestStatus: null,
      startISO: null,
      endISO: null,
      slots: [],
    };
  }

  const slots: HourlySlot[] = upcoming.map((hour) => ({
    timeISO: hour.timeISO,
    status: evaluateHour(hour, limits).status,
  }));

  const bestStatus = slots.reduce<AssessmentStatus>(
    (best, slot) => (statusRank(slot.status) < statusRank(best) ? slot.status : best),
    "NO_DATA"
  );

  if (bestStatus === "NO_DATA") {
    return {
      kind: "insufficient-data",
      bestStatus,
      startISO: null,
      endISO: null,
      slots,
    };
  }

  if (bestStatus === "UNFAVORABLE") {
    return {
      kind: "no-favorable",
      bestStatus,
      startISO: null,
      endISO: null,
      slots,
    };
  }

  const run = longestRun(slots, bestStatus);
  return {
    kind: "ok",
    bestStatus,
    startISO: run.startISO,
    endISO: run.endISO,
    slots,
  };
}

function longestRun(
  slots: HourlySlot[],
  status: AssessmentStatus
): { startISO: string; endISO: string } {
  let bestStart = 0;
  let bestLength = 0;
  let currentStart = 0;
  let currentLength = 0;

  for (let i = 0; i < slots.length; i++) {
    if (slots[i].status === status) {
      if (currentLength === 0) currentStart = i;
      currentLength++;
      if (currentLength > bestLength) {
        bestLength = currentLength;
        bestStart = currentStart;
      }
    } else {
      currentLength = 0;
    }
  }

  return {
    startISO: slots[bestStart].timeISO,
    endISO: slots[bestStart + bestLength - 1].timeISO,
  };
}

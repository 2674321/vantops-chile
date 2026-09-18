export type FlightTimeError = "invalid-start" | "invalid-end" | "end-before-start";

export type FlightTimeValidation = { ok: true } | { ok: false; error: FlightTimeError };

export function parseDateTimeLocal(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function validateFlightTimes(startedAt: string, endedAt: string): FlightTimeValidation {
  const start = parseDateTimeLocal(startedAt);
  if (start === null) return { ok: false, error: "invalid-start" };
  if (endedAt.trim() === "") return { ok: true };

  const end = parseDateTimeLocal(endedAt);
  if (end === null) return { ok: false, error: "invalid-end" };
  if (end < start) return { ok: false, error: "end-before-start" };
  return { ok: true };
}

export function computeDurationSeconds(startedAt: string, endedAt: string): number | undefined {
  const start = parseDateTimeLocal(startedAt);
  const end = parseDateTimeLocal(endedAt);
  if (start === null || end === null) return undefined;
  return Math.round((end - start) / 1000);
}

export type BatteryPercentError = "not-a-number" | "out-of-range";

export type BatteryPercentResult =
  | { ok: true; value: number | undefined }
  | { ok: false; error: BatteryPercentError };

const INTEGER_PATTERN = /^-?\d+$/;

export function parseBatteryPercent(raw: string): BatteryPercentResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: undefined };
  if (!INTEGER_PATTERN.test(trimmed)) return { ok: false, error: "not-a-number" };

  const value = Number(trimmed);
  if (value < 0 || value > 100) return { ok: false, error: "out-of-range" };
  return { ok: true, value };
}

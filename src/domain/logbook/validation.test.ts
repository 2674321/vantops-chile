import { describe, it, expect } from "vitest";
import {
  parseDateTimeLocal,
  validateFlightTimes,
  computeDurationSeconds,
  parseBatteryPercent,
} from "./validation";

describe("parseDateTimeLocal", () => {
  it("parses datetime-local values", () => {
    expect(parseDateTimeLocal("2026-01-15T09:30")).not.toBeNull();
  });

  it("returns null for empty or invalid values", () => {
    expect(parseDateTimeLocal("")).toBeNull();
    expect(parseDateTimeLocal("   ")).toBeNull();
    expect(parseDateTimeLocal("no-es-fecha")).toBeNull();
  });
});

describe("validateFlightTimes", () => {
  it("accepts start without end", () => {
    expect(validateFlightTimes("2026-01-15T09:30", "")).toEqual({ ok: true });
  });

  it("accepts end after start", () => {
    expect(validateFlightTimes("2026-01-15T09:30", "2026-01-15T10:00")).toEqual({ ok: true });
  });

  it("accepts end equal to start", () => {
    expect(validateFlightTimes("2026-01-15T09:30", "2026-01-15T09:30")).toEqual({ ok: true });
  });

  it("rejects an invalid start", () => {
    expect(validateFlightTimes("", "2026-01-15T10:00")).toEqual({ ok: false, error: "invalid-start" });
  });

  it("rejects an invalid end", () => {
    expect(validateFlightTimes("2026-01-15T09:30", "no-es-fecha")).toEqual({
      ok: false,
      error: "invalid-end",
    });
  });

  it("rejects end before start", () => {
    expect(validateFlightTimes("2026-01-15T10:00", "2026-01-15T09:30")).toEqual({
      ok: false,
      error: "end-before-start",
    });
  });
});

describe("computeDurationSeconds", () => {
  it("computes positive duration", () => {
    expect(computeDurationSeconds("2026-01-15T09:30", "2026-01-15T10:00")).toBe(1800);
  });

  it("returns undefined when end is missing", () => {
    expect(computeDurationSeconds("2026-01-15T09:30", "")).toBeUndefined();
  });
});

describe("parseBatteryPercent", () => {
  it("allows empty values", () => {
    expect(parseBatteryPercent("")).toEqual({ ok: true, value: undefined });
  });

  it("parses valid percentages", () => {
    expect(parseBatteryPercent("0")).toEqual({ ok: true, value: 0 });
    expect(parseBatteryPercent("55")).toEqual({ ok: true, value: 55 });
    expect(parseBatteryPercent("100")).toEqual({ ok: true, value: 100 });
  });

  it("rejects non integer values", () => {
    expect(parseBatteryPercent("55.5")).toEqual({ ok: false, error: "not-a-number" });
    expect(parseBatteryPercent("abc")).toEqual({ ok: false, error: "not-a-number" });
  });

  it("rejects out of range values", () => {
    expect(parseBatteryPercent("-1")).toEqual({ ok: false, error: "out-of-range" });
    expect(parseBatteryPercent("101")).toEqual({ ok: false, error: "out-of-range" });
  });
});

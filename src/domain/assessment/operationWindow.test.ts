import { describe, it, expect } from "vitest";
import type { HourlyWeather } from "../weather";
import type { FlightLimits } from "./limits";
import { findOperationWindow, statusRank } from "./operationWindow";
import { makeHour } from "../../test/fixtures";

const limits: FlightLimits = {
  windMaxKmh: 30,
  gustMaxKmh: 40,
  precipitationMaxMm: 0,
  visibilityMinMeters: 5000,
  temperatureMinC: 0,
  temperatureMaxC: 35,
};

const now = new Date("2026-09-17T11:00:00");
const opts = { now };

function hours(...items: Array<Partial<HourlyWeather>>) {
  return items.map((item, i) =>
    makeHour({ timeISO: `2026-09-17T${String(12 + i).padStart(2, "0")}:00`, ...item })
  );
}

describe("statusRank", () => {
  it("orders statuses from best to worst", () => {
    expect(statusRank("FAVORABLE")).toBeLessThan(statusRank("CAUTION"));
    expect(statusRank("CAUTION")).toBeLessThan(statusRank("UNFAVORABLE"));
    expect(statusRank("UNFAVORABLE")).toBeLessThan(statusRank("NO_DATA"));
  });
});

describe("findOperationWindow", () => {
  it("requires configured limits", () => {
    const result = findOperationWindow(hours({}), {}, opts);
    expect(result.kind).toBe("needs-limits");
    expect(result.bestStatus).toBeNull();
    expect(result.slots).toHaveLength(0);
  });

  it("returns insufficient data when there are no upcoming hours", () => {
    const result = findOperationWindow(
      [makeHour({ timeISO: "2026-09-17T08:00" })],
      limits,
      opts
    );
    expect(result.kind).toBe("insufficient-data");
  });

  it("returns the best contiguous favorable window", () => {
    const result = findOperationWindow(
      hours({ windSpeedKmh: 10 }, { windSpeedKmh: 12 }, { windSpeedKmh: 45 }),
      limits,
      opts
    );
    expect(result.kind).toBe("ok");
    expect(result.bestStatus).toBe("FAVORABLE");
    expect(result.startISO).toBe("2026-09-17T12:00");
    expect(result.endISO).toBe("2026-09-17T13:00");
  });

  it("reports no favorable window when every hour exceeds limits", () => {
    const result = findOperationWindow(
      hours({ windSpeedKmh: 45 }, { windSpeedKmh: 50 }),
      limits,
      opts
    );
    expect(result.kind).toBe("no-favorable");
    expect(result.bestStatus).toBe("UNFAVORABLE");
    expect(result.startISO).toBeNull();
  });

  it("prefers FAVORABLE over CAUTION and picks the longest run", () => {
    const result = findOperationWindow(
      hours(
        { windSpeedKmh: 26 },
        { windSpeedKmh: 10 },
        { windSpeedKmh: 11 },
        { windSpeedKmh: 26 },
        { windSpeedKmh: 12 }
      ),
      limits,
      opts
    );
    expect(result.kind).toBe("ok");
    expect(result.bestStatus).toBe("FAVORABLE");
    expect(result.startISO).toBe("2026-09-17T13:00");
    expect(result.endISO).toBe("2026-09-17T14:00");
  });

  it("ignores hours in the past", () => {
    const result = findOperationWindow(
      [
        makeHour({ timeISO: "2026-09-17T09:00", windSpeedKmh: 45 }),
        makeHour({ timeISO: "2026-09-17T12:00", windSpeedKmh: 10 }),
      ],
      limits,
      opts
    );
    expect(result.kind).toBe("ok");
    expect(result.startISO).toBe("2026-09-17T12:00");
  });

  it("respects the configured wind reference height", () => {
    const hour = makeHour({ timeISO: "2026-09-17T12:00", windSpeedKmh: 45, windSpeed100mKmh: 20 });
    const at10m = findOperationWindow([hour], limits, opts);
    const at100m = findOperationWindow([hour], { ...limits, windReferenceHeight: 100 }, opts);
    expect(at10m.kind).toBe("no-favorable");
    expect(at100m.kind).toBe("ok");
  });

  it("caps the number of evaluated slots", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      makeHour({ timeISO: `2026-09-17T${String((12 + i) % 24).padStart(2, "0")}:00` })
    );
    const result = findOperationWindow(many, limits, { ...opts, maxSlots: 5 });
    expect(result.slots).toHaveLength(5);
  });
});

import { describe, it, expect } from "vitest";
import { computeSolarTimes } from "./suncalcSolar";

describe("computeSolarTimes", () => {
  const santiago = { lat: -33.45, lon: -70.66 };
  const date = new Date("2026-08-26T12:00:00Z");

  it("returns sunrise before sunset", () => {
    const times = computeSolarTimes(date, santiago.lat, santiago.lon);
    expect(times.sunrise).toBeInstanceOf(Date);
    expect(times.sunset).toBeInstanceOf(Date);
    expect(times.sunrise?.getTime()).toBeLessThan(times.sunset?.getTime() ?? 0);
  });

  it("dayLength is reasonable for August in Santiago", () => {
    const times = computeSolarTimes(date, santiago.lat, santiago.lon);
    expect(times.dayLengthMinutes).toBeGreaterThan(500);
    expect(times.dayLengthMinutes).toBeLessThan(800);
  });

  it("golden hour end is after sunrise", () => {
    const times = computeSolarTimes(date, santiago.lat, santiago.lon);
    expect(times.goldenHourEnd).toBeInstanceOf(Date);
    expect(times.goldenHourEnd?.getTime()).toBeGreaterThan(
      times.sunrise?.getTime() ?? 0
    );
  });

  it("golden hour start is before sunset", () => {
    const times = computeSolarTimes(date, santiago.lat, santiago.lon);
    expect(times.goldenHourStart).toBeInstanceOf(Date);
    expect(times.goldenHourStart?.getTime()).toBeLessThan(
      times.sunset?.getTime() ?? 0
    );
  });

  it("is deterministic (same input → same output)", () => {
    const a = computeSolarTimes(date, santiago.lat, santiago.lon);
    const b = computeSolarTimes(date, santiago.lat, santiago.lon);
    expect(a.sunrise?.getTime()).toBe(b.sunrise?.getTime());
    expect(a.sunset?.getTime()).toBe(b.sunset?.getTime());
    expect(a.dayLengthMinutes).toBe(b.dayLengthMinutes);
  });

  it("works for northern hemisphere too", () => {
    const times = computeSolarTimes(new Date("2026-06-21T12:00:00Z"), 40.42, -3.7);
    expect(times.sunrise).toBeInstanceOf(Date);
    expect(times.sunset).toBeInstanceOf(Date);
    expect(times.dayLengthMinutes).toBeGreaterThan(800);
  });
});

import { describe, expect, it } from "vitest";
import {
  distanceFromMeters,
  distanceToMeters,
  speedFromKmh,
  speedToKmh,
  temperatureFromC,
  temperatureToC,
} from "./displayPreferences";

describe("display unit conversions", () => {
  it.each(["kmh", "ms", "kt"] as const)("round-trips 30 km/h through %s without drift", (unit) => {
    const displayed = speedFromKmh(30, unit);
    expect(speedToKmh(displayed, unit)).toBeCloseTo(30, 1);
  });

  it("round-trips Celsius through Fahrenheit", () => {
    expect(temperatureToC(temperatureFromC(20, "f"), "f")).toBeCloseTo(20, 6);
  });

  it("round-trips meters through feet", () => {
    expect(distanceToMeters(distanceFromMeters(5000, "imperial"), "imperial")).toBeCloseTo(5000, 1);
  });
});

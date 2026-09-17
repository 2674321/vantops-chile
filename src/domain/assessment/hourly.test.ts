import { describe, it, expect } from "vitest";
import type { FlightLimits } from "./limits";
import {
  assessmentInputFromHourly,
  evaluateHour,
  assessHourlyForecast,
} from "./hourly";
import { makeHour } from "../../test/fixtures";

const limits: FlightLimits = {
  windMaxKmh: 30,
  gustMaxKmh: 40,
  precipitationMaxMm: 0,
  visibilityMinMeters: 5000,
  temperatureMinC: 0,
  temperatureMaxC: 35,
};

describe("assessmentInputFromHourly", () => {
  it("maps weather fields into the assessment input", () => {
    const input = assessmentInputFromHourly(makeHour(), limits);
    expect(input.windSpeedKmh).toBe(10);
    expect(input.gustKmh).toBe(15);
    expect(input.visibilityM).toBe(10000);
    expect(input.precipitationMm).toBe(0);
    expect(input.temperatureC).toBe(15);
    expect(input.windMaxKmh).toBe(30);
  });

  it("uses wind at 100 m when the reference height is 100", () => {
    const input = assessmentInputFromHourly(makeHour(), { ...limits, windReferenceHeight: 100 });
    expect(input.windSpeedKmh).toBe(20);
    expect(input.windSpeed100mKmh).toBe(20);
  });

  it("uses wind at 10 m by default", () => {
    const input = assessmentInputFromHourly(makeHour(), limits);
    expect(input.windSpeedKmh).toBe(10);
  });
});

describe("evaluateHour", () => {
  it("returns FAVORABLE for a calm hour within limits", () => {
    expect(evaluateHour(makeHour(), limits).status).toBe("FAVORABLE");
  });

  it("returns UNFAVORABLE when a critical limit is exceeded", () => {
    expect(evaluateHour(makeHour({ windSpeedKmh: 45 }), limits).status).toBe("UNFAVORABLE");
  });

  it("returns CAUTION near a limit", () => {
    expect(evaluateHour(makeHour({ windSpeedKmh: 26 }), limits).status).toBe("CAUTION");
  });

  it("returns NO_DATA without configured limits", () => {
    expect(evaluateHour(makeHour(), {}).status).toBe("NO_DATA");
  });
});

describe("assessHourlyForecast", () => {
  it("keeps the original order and time stamps", () => {
    const result = assessHourlyForecast(
      [makeHour({ timeISO: "2026-09-17T12:00" }), makeHour({ timeISO: "2026-09-17T13:00" })],
      limits
    );
    expect(result.map((r) => r.timeISO)).toEqual(["2026-09-17T12:00", "2026-09-17T13:00"]);
    expect(result.every((r) => r.assessment.status === "FAVORABLE")).toBe(true);
  });
});

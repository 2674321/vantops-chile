import { describe, expect, it } from "vitest";
import { formatWeatherHourLabel, naiveLocalToEpochMs } from "./weatherTime";

describe("naiveLocalToEpochMs", () => {
  it("treats a naive time as UTC when offset is zero", () => {
    expect(naiveLocalToEpochMs("2026-09-17T21:30", 0)).toBe(
      Date.parse("2026-09-17T21:30:00Z")
    );
  });

  it("converts a local time to UTC using the offset", () => {
    const epoch = naiveLocalToEpochMs("2026-09-17T17:30", -4 * 3600);
    expect(epoch).toBe(Date.parse("2026-09-17T21:30:00Z"));
  });

  it("respects an explicit Z suffix without applying the offset", () => {
    expect(naiveLocalToEpochMs("2026-09-17T21:30:00Z", -4 * 3600)).toBe(
      Date.parse("2026-09-17T21:30:00Z")
    );
  });

  it("returns null for invalid input", () => {
    expect(naiveLocalToEpochMs("", 0)).toBeNull();
    expect(naiveLocalToEpochMs("definitivamente-no", 0)).toBeNull();
  });
});

describe("formatWeatherHourLabel", () => {
  it("formats an ISO local timestamp as HH:MM", () => {
    expect(formatWeatherHourLabel("2026-09-17T21:30")).toBe("21:30");
  });

  it("returns the original string when it cannot be formatted", () => {
    expect(formatWeatherHourLabel("bad")).toBe("bad");
  });
});

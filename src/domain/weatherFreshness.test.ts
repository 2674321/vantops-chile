import { describe, expect, it } from "vitest";
import { deriveWeatherFreshness } from "./weatherFreshness";

const now = new Date("2026-09-17T21:45:00Z");

describe("deriveWeatherFreshness", () => {
  it("marks a recent dataset as updated", () => {
    const result = deriveWeatherFreshness({
      dataTime: "2026-09-17T21:30",
      now,
    });
    expect(result.status).toBe("updated");
    expect(result.ageMinutes).toBe(15);
  });

  it("marks an old dataset as stale even if it was just received", () => {
    const result = deriveWeatherFreshness({
      dataTime: "2026-09-17T17:00",
      now,
    });
    expect(result.status).toBe("stale");
    expect(result.ageMinutes).toBe(285);
  });

  it("uses the dataset time, not the reception time (cached response)", () => {
    const cached = deriveWeatherFreshness({
      dataTime: "2026-09-17T18:00",
      now,
    });
    expect(cached.status).toBe("stale");
  });

  it("applies the operation UTC offset", () => {
    const withOffset = deriveWeatherFreshness({
      dataTime: "2026-09-17T17:30",
      utcOffsetSeconds: -4 * 3600,
      now,
    });
    expect(withOffset.status).toBe("updated");
    expect(withOffset.ageMinutes).toBe(15);
  });

  it("flags a future anomaly beyond the tolerance", () => {
    const result = deriveWeatherFreshness({
      dataTime: "2026-09-18T03:00",
      now,
    });
    expect(result.status).toBe("error");
    expect(result.futureAnomaly).toBe(true);
  });

  it("tolerates a small future timestamp caused by clock skew", () => {
    const result = deriveWeatherFreshness({
      dataTime: "2026-09-17T21:50",
      now,
    });
    expect(result.status).toBe("updated");
    expect(result.ageMinutes).toBe(0);
    expect(result.futureAnomaly).toBe(false);
  });

  it("returns no-data for an invalid timestamp", () => {
    const result = deriveWeatherFreshness({ dataTime: "no-es-fecha", now });
    expect(result.status).toBe("no-data");
    expect(result.validTimestamp).toBe(false);
    expect(result.ageMinutes).toBeNull();
  });

  it("returns no-data when the timestamp is missing", () => {
    expect(deriveWeatherFreshness({ dataTime: null, now }).status).toBe("no-data");
    expect(deriveWeatherFreshness({ dataTime: undefined, now }).status).toBe("no-data");
  });
});

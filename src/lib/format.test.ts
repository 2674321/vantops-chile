import { describe, expect, it } from "vitest";
import { formatClockTime } from "./format";

describe("formatClockTime", () => {
  it("returns an em dash for missing or invalid dates", () => {
    expect(formatClockTime(null)).toBe("—");
    expect(formatClockTime(undefined)).toBe("—");
    expect(formatClockTime(new Date("invalid"))).toBe("—");
  });

  it("formats in the location offset when provided", () => {
    // 2026-01-15T12:00:00Z con offset -03:00 (Chile verano) => 09:00
    const instant = new Date("2026-01-15T12:00:00.000Z");
    expect(formatClockTime(instant, -3 * 3600)).toBe("09:00");
  });

  it("handles positive offsets", () => {
    const instant = new Date("2026-01-15T12:00:00.000Z");
    expect(formatClockTime(instant, 5.5 * 3600)).toBe("17:30");
  });

  it("rolls over the day boundary with the offset", () => {
    const instant = new Date("2026-01-15T02:00:00.000Z");
    expect(formatClockTime(instant, -3 * 3600)).toBe("23:00");
  });

  it("falls back to device-local time when no offset is given", () => {
    const instant = new Date("2026-01-15T12:34:00.000Z");
    const result = formatClockTime(instant);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

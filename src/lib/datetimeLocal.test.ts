import { describe, expect, it } from "vitest";
import { isoToLocalDatetimeInput, localDatetimeInputToIso } from "./datetimeLocal";

describe("datetime-local conversion", () => {
  it("round-trips the local minute without treating UTC text as local text", () => {
    const iso = "2026-07-15T15:42:37.000Z";
    const local = isoToLocalDatetimeInput(iso);
    expect(localDatetimeInputToIso(local).slice(0, 16)).toBe(iso.slice(0, 16));
  });

  it("rejects malformed dates", () => {
    expect(() => isoToLocalDatetimeInput("invalid")).toThrow();
    expect(() => localDatetimeInputToIso("invalid")).toThrow();
  });
});

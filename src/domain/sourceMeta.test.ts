import { describe, it, expect } from "vitest";
import { computeFreshness, minutesSince } from "./sourceMeta";

describe("computeFreshness", () => {
  it("returns 'updated' for recent data", () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    expect(computeFreshness(recent, 30)).toBe("updated");
  });

  it("returns 'stale' for old data", () => {
    const old = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(computeFreshness(old, 30)).toBe("stale");
  });

  it("returns 'error' for invalid ISO", () => {
    expect(computeFreshness("not-a-date", 30)).toBe("error");
  });
});

describe("minutesSince", () => {
  it("returns 0 for now", () => {
    expect(minutesSince(new Date().toISOString())).toBe(0);
  });

  it("returns ~5 for 5 min ago", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(minutesSince(iso)).toBe(5);
  });
});

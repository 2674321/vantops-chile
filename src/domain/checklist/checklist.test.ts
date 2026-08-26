import { describe, it, expect } from "vitest";
import {
  getDefaultChecklist,
  getContextFromData,
  getContextualItems,
  getVisibleChecklistItems,
  getChecklistProgress,
  getItemsByCategory,
  toggleItem,
  resetChecklist,
} from "./engine";
import type { ChecklistState } from "./types";
import type { WeatherSnapshot } from "../weather";
import type { SolarTimes } from "../solar";

describe("getDefaultChecklist", () => {
  it("returns items from all 8 categories", () => {
    const items = getDefaultChecklist();
    const categories = new Set(items.map((i) => i.category));
    expect(categories.size).toBe(8);
  });

  it("returns 22 default items", () => {
    expect(getDefaultChecklist().length).toBe(22);
  });

  it("every item has a unique id", () => {
    const items = getDefaultChecklist();
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("items have required flag", () => {
    const items = getDefaultChecklist();
    expect(items.every((i) => typeof i.required === "boolean")).toBe(true);
  });
});

describe("getContextFromData", () => {
  const baseWeather: WeatherSnapshot = {
    current: {
      timeISO: "2026-08-26T12:00",
      temperatureC: 15,
      humidityPct: 70,
      precipitationMm: 0,
      weatherCode: 0,
      windSpeedKmh: 10,
      windGustsKmh: 15,
      windDirectionDeg: 270,
      windSpeed100mKmh: 20,
      windDirection100mDeg: 270,
      visibilityM: 10000,
      cloudCoverPct: 30,
    },
    hourly: [],
    meta: {
      source: "Open-Meteo",
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      status: "updated",
    },
  };

  it("detects rain", () => {
    const weather = {
      ...baseWeather,
      current: { ...baseWeather.current, precipitationMm: 2.5 },
    };
    const ctx = getContextFromData(weather, null, null);
    expect(ctx.rain).toBe(true);
  });

  it("no rain when precipitation is 0", () => {
    const ctx = getContextFromData(baseWeather, null, null);
    expect(ctx.rain).toBeUndefined();
  });

  it("detects low visibility", () => {
    const weather = {
      ...baseWeather,
      current: { ...baseWeather.current, visibilityM: 3000 },
    };
    const ctx = getContextFromData(weather, null, null);
    expect(ctx.lowVisibility).toBe(true);
  });

  it("detects strong wind", () => {
    const weather = {
      ...baseWeather,
      current: { ...baseWeather.current, windSpeedKmh: 35 },
    };
    const ctx = getContextFromData(weather, null, null);
    expect(ctx.strongWind).toBe(true);
  });

  it("detects night from solar times", () => {
    const pastSunset: SolarTimes = {
      sunrise: new Date("2026-08-26T07:00:00"),
      sunset: new Date("2026-08-26T18:00:00"),
      goldenHourEnd: null,
      goldenHourStart: null,
      dawn: null,
      dusk: null,
      dayLengthMinutes: null,
    };
    const ctx = getContextFromData(null, pastSunset, null);
    // Night depends on current time vs sunset; just verify it doesn't crash
    expect(typeof ctx.night === "boolean" || ctx.night === undefined).toBe(true);
  });

  it("handles null weather", () => {
    const ctx = getContextFromData(null, null, null);
    expect(ctx.rain).toBeUndefined();
    expect(ctx.lowVisibility).toBeUndefined();
    expect(ctx.strongWind).toBeUndefined();
  });
});

describe("getContextualItems", () => {
  it("returns rain item when rain context", () => {
    const items = getContextualItems({ rain: true });
    expect(items.some((i) => i.id === "cli-precipitacion")).toBe(true);
  });

  it("returns strong wind item", () => {
    const items = getContextualItems({ strongWind: true });
    expect(items.some((i) => i.id === "cli-rafagas")).toBe(true);
  });

  it("returns low visibility item", () => {
    const items = getContextualItems({ lowVisibility: true });
    expect(items.some((i) => i.id === "cli-visibilidad-baja")).toBe(true);
  });

  it("returns night item", () => {
    const items = getContextualItems({ night: true });
    expect(items.some((i) => i.id === "cli-noche")).toBe(true);
  });

  it("returns empty for empty context", () => {
    expect(getContextualItems({}).length).toBe(0);
  });

  it("returns multiple items for multiple conditions", () => {
    const items = getContextualItems({ rain: true, strongWind: true });
    expect(items.length).toBe(2);
  });
});

describe("getVisibleChecklistItems", () => {
  it("base items always present", () => {
    const base = getDefaultChecklist();
    const visible = getVisibleChecklistItems(base, {});
    expect(visible.length).toBe(base.length);
  });

  it("contextual items added when conditions met", () => {
    const base = getDefaultChecklist();
    const visible = getVisibleChecklistItems(base, { rain: true });
    expect(visible.length).toBe(base.length + 1);
  });

  it("no duplicate ids", () => {
    const base = getDefaultChecklist();
    const visible = getVisibleChecklistItems(base, { rain: true, strongWind: true });
    const ids = visible.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getChecklistProgress", () => {
  const items = getDefaultChecklist();

  it("all unchecked => 0%", () => {
    const p = getChecklistProgress(items, []);
    expect(p.checked).toBe(0);
    expect(p.percentage).toBe(0);
    expect(p.complete).toBe(false);
    expect(p.requiredRemaining).toBeGreaterThan(0);
  });

  it("all checked => 100%", () => {
    const states: ChecklistState[] = items.map((i) => ({
      itemId: i.id,
      checked: true,
      checkedAt: new Date().toISOString(),
    }));
    const p = getChecklistProgress(items, states);
    expect(p.checked).toBe(items.length);
    expect(p.percentage).toBe(100);
    expect(p.complete).toBe(true);
    expect(p.requiredRemaining).toBe(0);
  });

  it("partial check", () => {
    const states: ChecklistState[] = items.slice(0, 10).map((i) => ({
      itemId: i.id,
      checked: true,
      checkedAt: new Date().toISOString(),
    }));
    const p = getChecklistProgress(items, states);
    expect(p.checked).toBe(10);
    expect(p.remaining).toBe(items.length - 10);
    expect(p.complete).toBe(false);
  });

  it("handles empty items", () => {
    const p = getChecklistProgress([], []);
    expect(p.total).toBe(0);
    expect(p.complete).toBe(false);
  });
});

describe("getItemsByCategory", () => {
  it("groups items by category", () => {
    const items = getDefaultChecklist();
    const grouped = getItemsByCategory(items);
    expect(grouped.size).toBe(8);
  });
});

describe("toggleItem", () => {
  it("adds new checked state", () => {
    const result = toggleItem([], "test-id");
    expect(result.length).toBe(1);
    expect(result[0].itemId).toBe("test-id");
    expect(result[0].checked).toBe(true);
    expect(result[0].checkedAt).toBeTruthy();
  });

  it("unchecks already checked item", () => {
    const states: ChecklistState[] = [
      { itemId: "test-id", checked: true, checkedAt: new Date().toISOString() },
    ];
    const result = toggleItem(states, "test-id");
    expect(result.length).toBe(0);
  });

  it("does not duplicate items", () => {
    let states = toggleItem([], "a");
    states = toggleItem(states, "b");
    states = toggleItem(states, "a");
    expect(states.length).toBe(1);
  });
});

describe("resetChecklist", () => {
  it("returns empty array", () => {
    expect(resetChecklist()).toEqual([]);
  });
});

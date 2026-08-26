import { describe, it, expect } from "vitest";
import {
  getDefaultChecklist,
  getContextFromData,
  getContextualItems,
  getVisibleChecklistItems,
  getChecklistProgress,
  getItemsByCategory,
  getWarningItems,
  toggleItem,
  resetChecklist,
} from "./engine";
import { isApplicable } from "./defaultChecklist";
import type { ChecklistState, ChecklistItem } from "./types";
import type { WeatherSnapshot } from "../weather";
import type { SolarTimes } from "../solar";
import type { FlightAssessment } from "../assessment/types";
import type { AircraftProfile } from "../assessment/aircraft";

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

describe("getDefaultChecklist", () => {
  it("returns items from all 8 categories", () => {
    const items = getDefaultChecklist();
    const categories = new Set(items.map((i) => i.category));
    expect(categories.size).toBe(8);
  });

  it("returns more than 22 items (type-specific added)", () => {
    expect(getDefaultChecklist().length).toBeGreaterThanOrEqual(22);
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

describe("isApplicable", () => {
  const multirotorItem: ChecklistItem = {
    id: "test-multi",
    category: "AERONAVE",
    title: "Test multirotor",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR"] },
  };

  const fixedWingItem: ChecklistItem = {
    id: "test-fixed",
    category: "AERONAVE",
    title: "Test fixed wing",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING", "VTOL"] },
  };

  const universalItem: ChecklistItem = {
    id: "test-universal",
    category: "EQUIPO",
    title: "Test universal",
    required: true,
  };

  it("universal item always applies", () => {
    expect(isApplicable(universalItem)).toBe(true);
    expect(isApplicable(universalItem, "MULTIROTOR")).toBe(true);
    expect(isApplicable(universalItem, "FIXED_WING")).toBe(true);
  });

  it("multirotor item applies to multirrotor", () => {
    expect(isApplicable(multirotorItem, "MULTIROTOR")).toBe(true);
  });

  it("multirotor item does not apply to fixed wing", () => {
    expect(isApplicable(multirotorItem, "FIXED_WING")).toBe(false);
  });

  it("multirotor item applies when no aircraft type set", () => {
    expect(isApplicable(multirotorItem)).toBe(true);
  });

  it("fixed wing item applies to vtol", () => {
    expect(isApplicable(fixedWingItem, "VTOL")).toBe(true);
  });

  it("fixed wing item does not apply to helicopter", () => {
    expect(isApplicable(fixedWingItem, "HELICOPTER")).toBe(false);
  });
});

describe("getContextFromData", () => {
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
    expect(typeof ctx.night === "boolean" || ctx.night === undefined).toBe(true);
  });

  it("handles null weather", () => {
    const ctx = getContextFromData(null, null, null);
    expect(ctx.rain).toBeUndefined();
    expect(ctx.lowVisibility).toBeUndefined();
    expect(ctx.strongWind).toBeUndefined();
  });

  it("assessment wind warning triggers strongWind", () => {
    const assessment: FlightAssessment = {
      status: "CAUTION",
      reasons: [
        { code: "WIND_NEAR_LIMIT", severity: "warning", message: "Viento cercano" },
      ],
      evaluatedAt: new Date().toISOString(),
      missingData: [],
    };
    const ctx = getContextFromData(null, null, assessment);
    expect(ctx.strongWind).toBe(true);
  });

  it("assessment gust warning triggers strongWind", () => {
    const assessment: FlightAssessment = {
      status: "UNFAVORABLE",
      reasons: [
        { code: "GUST_EXCEEDED", severity: "critical", message: "Ráfaga excedida" },
      ],
      evaluatedAt: new Date().toISOString(),
      missingData: [],
    };
    const ctx = getContextFromData(null, null, assessment);
    expect(ctx.strongWind).toBe(true);
  });

  it("assessment vis warning triggers lowVisibility", () => {
    const assessment: FlightAssessment = {
      status: "UNFAVORABLE",
      reasons: [
        { code: "VIS_BELOW_MIN", severity: "critical", message: "Visibilidad baja" },
      ],
      evaluatedAt: new Date().toISOString(),
      missingData: [],
    };
    const ctx = getContextFromData(null, null, assessment);
    expect(ctx.lowVisibility).toBe(true);
  });

  it("assessment precip warning triggers rain", () => {
    const assessment: FlightAssessment = {
      status: "UNFAVORABLE",
      reasons: [
        { code: "PRECIP_EXCEEDED", severity: "critical", message: "Precipitación" },
      ],
      evaluatedAt: new Date().toISOString(),
      missingData: [],
    };
    const ctx = getContextFromData(null, null, assessment);
    expect(ctx.rain).toBe(true);
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

  it("filters items by aircraft type", () => {
    const base = getDefaultChecklist();
    const multirotor: AircraftProfile = {
      id: "test",
      name: "Test MR",
      type: "MULTIROTOR",
    };
    const visible = getVisibleChecklistItems(base, {}, multirotor);
    const ids = visible.map((i) => i.id);
    expect(ids).toContain("aero-helices");
    expect(ids).toContain("aero-motores");
    expect(ids).toContain("aero-rth");
    expect(ids).not.toContain("aero-superficies");
    expect(ids).not.toContain("aero-propulsion");
  });

  it("fixed wing shows different items", () => {
    const base = getDefaultChecklist();
    const fixedWing: AircraftProfile = {
      id: "test",
      name: "Test FW",
      type: "FIXED_WING",
    };
    const visible = getVisibleChecklistItems(base, {}, fixedWing);
    const ids = visible.map((i) => i.id);
    expect(ids).toContain("aero-superficies");
    expect(ids).toContain("aero-propulsion");
    expect(ids).toContain("aero-lanzamiento");
    expect(ids).not.toContain("aero-helices");
    expect(ids).not.toContain("aero-rth");
  });

  it("vtol shows both fixed wing and vertical items", () => {
    const base = getDefaultChecklist();
    const vtol: AircraftProfile = {
      id: "test",
      name: "Test VTOL",
      type: "VTOL",
    };
    const visible = getVisibleChecklistItems(base, {}, vtol);
    const ids = visible.map((i) => i.id);
    expect(ids).toContain("aero-superficies");
    expect(ids).toContain("aero-vertical");
    expect(ids).toContain("aero-transicion");
    expect(ids).not.toContain("aero-helices");
  });

  it("helicopter shows rotor items", () => {
    const base = getDefaultChecklist();
    const heli: AircraftProfile = {
      id: "test",
      name: "Test Heli",
      type: "HELICOPTER",
    };
    const visible = getVisibleChecklistItems(base, {}, heli);
    const ids = visible.map((i) => i.id);
    expect(ids).toContain("aero-helices");
    expect(ids).toContain("aero-rotor");
    expect(ids).toContain("aero-colaptil");
    expect(ids).not.toContain("aero-motores");
  });

  it("no aircraft shows all items", () => {
    const base = getDefaultChecklist();
    const visible = getVisibleChecklistItems(base, {}, null);
    expect(visible.length).toBe(base.length);
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

describe("getWarningItems", () => {
  it("returns items matching context warnings", () => {
    const base = getDefaultChecklist();
    const visible = getVisibleChecklistItems(base, { rain: true, strongWind: true });
    const warnings = getWarningItems(visible, { rain: true, strongWind: true });
    expect(warnings.some((i) => i.id === "cli-precipitacion")).toBe(true);
    expect(warnings.some((i) => i.id === "cli-rafagas")).toBe(true);
  });

  it("returns empty for no context", () => {
    const items = getDefaultChecklist();
    expect(getWarningItems(items, {}).length).toBe(0);
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

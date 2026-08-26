import type {
  ChecklistItem,
  ChecklistState,
  ChecklistProgress,
  ChecklistContext,
  ChecklistCategory,
} from "./types";
import { DEFAULT_CHECKLIST, CONTEXTUAL_ITEMS, isApplicable } from "./defaultChecklist";
import type { WeatherSnapshot } from "../weather";
import type { SolarTimes } from "../solar";
import type { FlightAssessment } from "../assessment/types";
import type { AircraftProfile } from "../assessment/aircraft";

export function getDefaultChecklist(): ChecklistItem[] {
  return [...DEFAULT_CHECKLIST];
}

export function getContextFromData(
  weather: WeatherSnapshot | null,
  solar: SolarTimes | null,
  assessment: FlightAssessment | null
): ChecklistContext {
  const ctx: ChecklistContext = {};

  if (weather) {
    const c = weather.current;
    if (c.precipitationMm != null && c.precipitationMm > 0) ctx.rain = true;
    if (c.visibilityM != null && c.visibilityM < 5000) ctx.lowVisibility = true;
    if (c.windSpeedKmh != null && c.windSpeedKmh > 25) ctx.strongWind = true;
  }

  if (solar?.sunrise && solar?.sunset) {
    const now = new Date();
    if (now < solar.sunrise || now > solar.sunset) ctx.night = true;
  }

  if (assessment) {
    const hasWindWarning = assessment.reasons.some(
      (r) => r.code.startsWith("WIND") && r.severity !== "info"
    );
    const hasGustWarning = assessment.reasons.some(
      (r) => r.code.startsWith("GUST") && r.severity !== "info"
    );
    if (hasWindWarning || hasGustWarning) ctx.strongWind = true;

    const hasVisWarning = assessment.reasons.some(
      (r) => r.code.startsWith("VIS") && r.severity !== "info"
    );
    if (hasVisWarning) ctx.lowVisibility = true;

    const hasPrecipWarning = assessment.reasons.some(
      (r) => r.code.startsWith("PRECIP") && r.severity !== "info"
    );
    if (hasPrecipWarning) ctx.rain = true;
  }

  return ctx;
}

export function getContextualItems(context: ChecklistContext): ChecklistItem[] {
  return CONTEXTUAL_ITEMS.filter((item) => {
    if (!item.context) return false;
    if (item.context.rain && !context.rain) return false;
    if (item.context.lowVisibility && !context.lowVisibility) return false;
    if (item.context.strongWind && !context.strongWind) return false;
    if (item.context.night && !context.night) return false;
    return true;
  });
}

export function getVisibleChecklistItems(
  base: ChecklistItem[],
  context: ChecklistContext,
  aircraft?: AircraftProfile | null
): ChecklistItem[] {
  const aircraftType = aircraft?.type;
  const filtered = base.filter((item) => isApplicable(item, aircraftType));
  const contextual = getContextualItems(context);
  const allIds = new Set(filtered.map((i) => i.id));
  const extras = contextual.filter((i) => !allIds.has(i.id));
  return [...filtered, ...extras];
}

export function getChecklistProgress(
  items: ChecklistItem[],
  states: ChecklistState[]
): ChecklistProgress {
  const stateMap = new Map(states.map((s) => [s.itemId, s.checked]));
  const total = items.length;
  const checked = items.filter((i) => stateMap.get(i.id) === true).length;
  const remaining = total - checked;
  const requiredRemaining = items.filter(
    (i) => i.required && stateMap.get(i.id) !== true
  ).length;
  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
  const complete = requiredRemaining === 0 && total > 0;

  return { total, checked, remaining, requiredRemaining, percentage, complete };
}

export function getItemsByCategory(
  items: ChecklistItem[]
): Map<ChecklistCategory, ChecklistItem[]> {
  const map = new Map<ChecklistCategory, ChecklistItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

export function getWarningItems(
  items: ChecklistItem[],
  context: ChecklistContext
): ChecklistItem[] {
  return items.filter((item) => {
    if (item.context?.rain && context.rain) return true;
    if (item.context?.strongWind && context.strongWind) return true;
    if (item.context?.lowVisibility && context.lowVisibility) return true;
    if (item.context?.night && context.night) return true;
    return false;
  });
}

export function toggleItem(
  states: ChecklistState[],
  itemId: string
): ChecklistState[] {
  const existing = states.find((s) => s.itemId === itemId);
  if (existing) {
    if (existing.checked) {
      return states.filter((s) => s.itemId !== itemId);
    }
    return states.map((s) =>
      s.itemId === itemId
        ? { ...s, checked: true, checkedAt: new Date().toISOString() }
        : s
    );
  }
  return [
    ...states,
    { itemId, checked: true, checkedAt: new Date().toISOString() },
  ];
}

export function resetChecklist(): ChecklistState[] {
  return [];
}

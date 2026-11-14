export type SpeedUnit = "kmh" | "ms" | "kt";
export type TemperatureUnit = "c" | "f";
export type DistanceUnit = "metric" | "imperial";

export interface DisplayPreferences {
  speedUnit: SpeedUnit;
  temperatureUnit: TemperatureUnit;
  distanceUnit: DistanceUnit;
  expertMode: boolean;
}

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  speedUnit: "kmh",
  temperatureUnit: "c",
  distanceUnit: "metric",
  expertMode: false,
};

const round = (value: number, digits = 1) =>
  Number(value.toFixed(digits));

export function speedFromKmh(value: number, unit: SpeedUnit): number {
  if (unit === "ms") return round(value / 3.6, 2);
  if (unit === "kt") return round(value / 1.852, 2);
  return round(value);
}

export function speedToKmh(value: number, unit: SpeedUnit): number {
  if (unit === "ms") return value * 3.6;
  if (unit === "kt") return value * 1.852;
  return value;
}

export function speedUnitLabel(unit: SpeedUnit): string {
  return unit === "ms" ? "m/s" : unit === "kt" ? "kt" : "km/h";
}

export function temperatureFromC(value: number, unit: TemperatureUnit): number {
  return unit === "f" ? round((value * 9) / 5 + 32) : round(value);
}

export function temperatureToC(value: number, unit: TemperatureUnit): number {
  return unit === "f" ? ((value - 32) * 5) / 9 : value;
}

export function temperatureUnitLabel(unit: TemperatureUnit): string {
  return unit === "f" ? "°F" : "°C";
}

export function distanceFromMeters(value: number, unit: DistanceUnit): number {
  return unit === "imperial" ? round(value * 3.28084) : round(value);
}

export function distanceToMeters(value: number, unit: DistanceUnit): number {
  return unit === "imperial" ? value / 3.28084 : value;
}

export function distanceUnitLabel(unit: DistanceUnit): string {
  return unit === "imperial" ? "ft" : "m";
}

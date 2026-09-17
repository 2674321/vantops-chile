import type { HourlyWeather } from "../domain/weather";

export function makeHour(overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    timeISO: "2026-09-17T12:00",
    temperatureC: 15,
    humidityPct: 60,
    precipitationMm: 0,
    weatherCode: 1,
    windSpeedKmh: 10,
    windGustsKmh: 15,
    windDirectionDeg: 200,
    windSpeed100mKmh: 20,
    windDirection100mDeg: 210,
    visibilityM: 10000,
    cloudCoverPct: 20,
    ...overrides,
  };
}

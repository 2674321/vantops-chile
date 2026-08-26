import type { Coordinate } from "../../domain/coordinate";

export type DataStatus = "OK" | "PARTIAL" | "ERROR";

export interface WeatherCurrent {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  windDirectionDeg: number | null;
  weatherCode: number | null;
}

export interface SunTimes {
  sunriseLocal: string | null;
  sunsetLocal: string | null;
}

export interface WeatherSnapshot {
  source: "open-meteo";
  location: Coordinate;
  timezone: string | null;
  current: WeatherCurrent;
  windSpeed100mKmh: number | null;
  sun: SunTimes;
  observedAtLocalIso: string | null;
  fetchedAtIso: string;
  status: DataStatus;
}

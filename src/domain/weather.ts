import type { DataSourceMeta } from "./sourceMeta";

export interface CurrentWeather {
  timeISO: string;
  temperatureC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  weatherCode: number;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  windDirectionDeg: number | null;
  windSpeed100mKmh: number | null;
  windDirection100mDeg: number | null;
  visibilityM: number | null;
  cloudCoverPct: number | null;
}

export interface HourlyWeather {
  timeISO: string;
  windSpeed100mKmh: number | null;
  windDirection100mDeg: number | null;
}

export interface WeatherSnapshot {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  meta: DataSourceMeta;
}

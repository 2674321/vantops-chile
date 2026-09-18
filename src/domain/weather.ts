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
  temperatureC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  weatherCode: number | null;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  windDirectionDeg: number | null;
  windSpeed100mKmh: number | null;
  windDirection100mDeg: number | null;
  visibilityM: number | null;
  cloudCoverPct: number | null;
}

export interface WeatherSnapshot {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  meta: DataSourceMeta;
  /** Zona horaria IANA del punto de operación (Open-Meteo timezone=auto). */
  timezone?: string;
  timezoneAbbreviation?: string;
  /** Desplazamiento UTC en segundos aplicable al punto de operación. */
  utcOffsetSeconds?: number;
}

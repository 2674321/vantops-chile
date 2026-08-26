import type { Coordinate } from "../../domain/coordinate";
import type { DataStatus, WeatherSnapshot } from "./weather.types";

export type WeatherErrorCode =
  | "WEATHER_TIMEOUT"
  | "WEATHER_NETWORK"
  | "WEATHER_INVALID_RESPONSE";

const TIMEOUT_MS = 10_000;

interface OpenMeteoResponse {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    precipitation?: number | null;
    weather_code?: number | null;
    wind_speed_10m?: number | null;
    wind_direction_10m?: number | null;
    wind_gusts_10m?: number | null;
  };
  hourly?: {
    time?: string[];
    wind_speed_100m?: (number | null)[];
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
}

export function buildForecastUrl({ latitude, longitude }: Coordinate): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
    hourly: "wind_speed_100m",
    daily: "sunrise,sunset",
    forecast_days: "1",
    wind_speed_unit: "kmh",
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/** Índice de la hora más cercana (sin pasar de la actual) dentro del arreglo horario. */
export function nearestHourlyIndex(times: string[], currentTimeLocal: string): number {
  if (times.length === 0) return -1;
  const exact = times.indexOf(currentTimeLocal);
  if (exact !== -1) return exact;

  let candidate = -1;
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= currentTimeLocal) candidate = i;
    else break;
  }
  return candidate !== -1 ? candidate : 0;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function firstDailyValue(values: string[] | undefined): string | null {
  return typeof values?.[0] === "string" ? values[0] : null;
}

export function mapOpenMeteoToSnapshot(
  data: unknown,
  location: Coordinate,
  fetchedAtIso: string,
): WeatherSnapshot {
  const response = data as OpenMeteoResponse;
  const current = response.current;

  if (!current || typeof current.time !== "string") {
    const error = new Error("Respuesta inválida de Open-Meteo") as Error & {
      code?: WeatherErrorCode;
    };
    error.code = "WEATHER_INVALID_RESPONSE";
    throw error;
  }

  let windSpeed100mKmh: number | null = null;
  const hourlyTimes = response.hourly?.time;
  const hourlyWind = response.hourly?.wind_speed_100m;
  if (hourlyTimes && hourlyWind) {
    const index = nearestHourlyIndex(hourlyTimes, current.time);
    if (index >= 0) windSpeed100mKmh = num(hourlyWind[index]);
  }

  const currentValues = [
    num(current.temperature_2m),
    num(current.wind_speed_10m),
    num(current.wind_gusts_10m),
  ];
  const sunMissing =
    firstDailyValue(response.daily?.sunrise) === null ||
    firstDailyValue(response.daily?.sunset) === null;
  const status: DataStatus =
    currentValues.some((v) => v === null) ||
    windSpeed100mKmh === null ||
    sunMissing
      ? "PARTIAL"
      : "OK";

  return {
    source: "open-meteo",
    location,
    timezone: typeof response.timezone === "string" ? response.timezone : null,
    current: {
      temperatureC: num(current.temperature_2m),
      apparentTemperatureC: num(current.apparent_temperature),
      humidityPct: num(current.relative_humidity_2m),
      precipitationMm: num(current.precipitation),
      windSpeedKmh: num(current.wind_speed_10m),
      windGustsKmh: num(current.wind_gusts_10m),
      windDirectionDeg: num(current.wind_direction_10m),
      weatherCode: num(current.weather_code),
    },
    windSpeed100mKmh,
    sun: {
      sunriseLocal: firstDailyValue(response.daily?.sunrise),
      sunsetLocal: firstDailyValue(response.daily?.sunset),
    },
    observedAtLocalIso: current.time,
    fetchedAtIso,
    status,
  };
}

export async function fetchWeatherSnapshot(coordinate: Coordinate): Promise<WeatherSnapshot> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildForecastUrl(coordinate), {
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        code?: WeatherErrorCode;
      };
      error.code = "WEATHER_NETWORK";
      throw error;
    }
    const data: unknown = await response.json();
    return mapOpenMeteoToSnapshot(data, coordinate, new Date().toISOString());
  } catch (error) {
    const err = error as Error & { code?: WeatherErrorCode };
    if (err.code !== undefined) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      const abortError = new Error("Timeout") as Error & { code?: WeatherErrorCode };
      abortError.code = "WEATHER_TIMEOUT";
      throw abortError;
    }
    const networkError = new Error("Fallo de red") as Error & {
      code?: WeatherErrorCode;
    };
    networkError.code = "WEATHER_NETWORK";
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }
}

import type { WeatherSnapshot } from "../../domain/weather";

const BASE = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 8000;

const HOURLY_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
  "wind_speed_100m",
  "wind_direction_100m",
  "visibility",
  "cloud_cover",
].join(",");

export class WeatherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherError";
  }
}

export function buildWeatherUrl(
  lat: number,
  lon: number,
  timeZone = "America/Santiago"
): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "visibility",
      "cloud_cover",
    ].join(","),
    hourly: HOURLY_VARIABLES,
    wind_speed_unit: "kmh",
    timezone: timeZone,
  });
  return `${BASE}?${params}`;
}

interface OpenMeteoCurrent {
  time: string;
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  precipitation: number | null;
  weather_code: number;
  wind_speed_10m: number | null;
  wind_gusts_10m: number | null;
  wind_direction_10m: number | null;
  visibility: number | null;
  cloud_cover: number | null;
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m?: (number | null)[];
  relative_humidity_2m?: (number | null)[];
  precipitation?: (number | null)[];
  weather_code?: (number | null)[];
  wind_speed_10m?: (number | null)[];
  wind_gusts_10m?: (number | null)[];
  wind_direction_10m?: (number | null)[];
  wind_speed_100m?: (number | null)[];
  wind_direction_100m?: (number | null)[];
  visibility?: (number | null)[];
  cloud_cover?: (number | null)[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
}

function nearestHourlyIndex(times: string[]): number {
  const now = Date.now();
  let best = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

function at(series: (number | null)[] | undefined, index: number): number | null {
  return series?.[index] ?? null;
}

export function mapWeatherResponse(
  data: OpenMeteoResponse
): Omit<WeatherSnapshot, "meta"> {
  const c = data.current;
  const hourly = data.hourly;
  let wind100: number | null = null;
  let windDir100: number | null = null;
  if (hourly?.time.length) {
    const idx = nearestHourlyIndex(hourly.time);
    wind100 = at(hourly.wind_speed_100m, idx);
    windDir100 = at(hourly.wind_direction_100m, idx);
  }
  return {
    current: {
      timeISO: c.time,
      temperatureC: c.temperature_2m,
      humidityPct: c.relative_humidity_2m,
      precipitationMm: c.precipitation,
      weatherCode: c.weather_code,
      windSpeedKmh: c.wind_speed_10m,
      windGustsKmh: c.wind_gusts_10m,
      windDirectionDeg: c.wind_direction_10m,
      windSpeed100mKmh: wind100,
      windDirection100mDeg: windDir100,
      visibilityM: c.visibility,
      cloudCoverPct: c.cloud_cover,
    },
    hourly: (hourly?.time ?? []).map((t, i) => ({
      timeISO: t,
      temperatureC: at(hourly?.temperature_2m, i),
      humidityPct: at(hourly?.relative_humidity_2m, i),
      precipitationMm: at(hourly?.precipitation, i),
      weatherCode: at(hourly?.weather_code, i),
      windSpeedKmh: at(hourly?.wind_speed_10m, i),
      windGustsKmh: at(hourly?.wind_gusts_10m, i),
      windDirectionDeg: at(hourly?.wind_direction_10m, i),
      windSpeed100mKmh: at(hourly?.wind_speed_100m, i),
      windDirection100mDeg: at(hourly?.wind_direction_100m, i),
      visibilityM: at(hourly?.visibility, i),
      cloudCoverPct: at(hourly?.cloud_cover, i),
    })),
  };
}

export async function fetchWeatherSnapshot(
  lat: number,
  lon: number
): Promise<WeatherSnapshot> {
  const requestedAt = new Date().toISOString();
  const url = buildWeatherUrl(lat, lon);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new WeatherError("Timeout al consultar Open-Meteo");
    }
    throw new WeatherError("No se pudo contactar Open-Meteo");
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new WeatherError(`HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  if (!data?.current) throw new WeatherError("Respuesta incompleta");
  const snapshot = mapWeatherResponse(data);
  return {
    ...snapshot,
    meta: {
      source: "Open-Meteo",
      requestedAt,
      receivedAt: new Date().toISOString(),
      status: "updated",
    },
  };
}

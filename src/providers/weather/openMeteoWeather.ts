import type { WeatherSnapshot } from "../../domain/weather";

const BASE = "https://api.open-meteo.com/v1/forecast";

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
    hourly: "wind_speed_100m,wind_direction_100m",
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
  wind_speed_100m: (number | null)[];
  wind_direction_100m: (number | null)[];
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

export function mapWeatherResponse(
  data: OpenMeteoResponse
): Omit<WeatherSnapshot, "meta"> {
  const c = data.current;
  let wind100: number | null = null;
  let windDir100: number | null = null;
  if (data.hourly?.time.length) {
    const idx = nearestHourlyIndex(data.hourly.time);
    wind100 = data.hourly.wind_speed_100m[idx] ?? null;
    windDir100 = data.hourly.wind_direction_100m[idx] ?? null;
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
    hourly: (data.hourly?.time ?? []).map((t, i) => ({
      timeISO: t,
      windSpeed100mKmh: data.hourly?.wind_speed_100m[i] ?? null,
      windDirection100mDeg: data.hourly?.wind_direction_100m[i] ?? null,
    })),
  };
}

export async function fetchWeatherSnapshot(
  lat: number,
  lon: number
): Promise<WeatherSnapshot> {
  const requestedAt = new Date().toISOString();
  const url = buildWeatherUrl(lat, lon);
  const res = await fetch(url);
  if (!res.ok) throw new WeatherError(`HTTP ${res.status}`);
  const data: OpenMeteoResponse = await res.json();
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

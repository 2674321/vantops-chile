import type { WeatherSnapshot } from "../../domain/weather";
import { deriveWeatherFreshness } from "../../domain/weatherFreshness";
import { ProviderError } from "../../domain/providerError";
import type { ProviderErrorKind } from "../../domain/providerError";
import { isValidCoordinate } from "../../domain/coordinate";
import { recordProviderError } from "../../domain/providerDiagnostic";

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

export class WeatherError extends ProviderError {
  constructor(kind: ProviderErrorKind, message: string, status?: number) {
    super("Open-Meteo", kind, message, status);
    this.name = "WeatherError";
  }
}

export function buildWeatherUrl(
  lat: number,
  lon: number,
  timeZone = "auto"
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
  timezone?: string;
  timezone_abbreviation?: string;
  utc_offset_seconds?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim() !== "")
  );
}

/**
 * Validación estructural temprana de una respuesta de Open-Meteo.
 *
 * Propósito: si la API cambia silenciosamente su esquema, la falla ocurre aquí
 * ("invalid-response") y no se propaga `undefined` o tipos corruptos a la UI.
 * Se exige solo lo necesario: `current.time` (deriva `dataTime`) y
 * `weather_code` (campo no anulable del modelo). El resto puede faltar y se
 * mapea a `null` cuando corresponde.
 */
export function parseOpenMeteoResponse(value: unknown): OpenMeteoResponse {
  if (!isRecord(value) || !isRecord(value.current)) {
    throw new WeatherError("invalid-response", "Respuesta incompleta de Open-Meteo");
  }
  const current = value.current;
  if (typeof current.time !== "string" || current.time.trim() === "") {
    throw new WeatherError("invalid-response", "Respuesta incompleta de Open-Meteo");
  }
  if (typeof current.weather_code !== "number" || !Number.isFinite(current.weather_code)) {
    throw new WeatherError("invalid-response", "Respuesta incompleta de Open-Meteo");
  }
  if (value.hourly !== undefined) {
    if (!isRecord(value.hourly)) {
      throw new WeatherError("invalid-response", "Respuesta incompleta de Open-Meteo");
    }
    if (!isStringArray(value.hourly.time)) {
      throw new WeatherError("invalid-response", "Respuesta incompleta de Open-Meteo");
    }
  }
  return value as unknown as OpenMeteoResponse;
}

/** Número válido o null: evita que un valor no numérico (string/NaN/Infinity)
 *  de la API llegue a la UI; no inventa ningún valor. */
function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
  return numOrNull(series?.[index]);
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
    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation,
    utcOffsetSeconds: data.utc_offset_seconds,
    current: {
      timeISO: c.time,
      temperatureC: numOrNull(c.temperature_2m),
      humidityPct: numOrNull(c.relative_humidity_2m),
      precipitationMm: numOrNull(c.precipitation),
      weatherCode: c.weather_code,
      windSpeedKmh: numOrNull(c.wind_speed_10m),
      windGustsKmh: numOrNull(c.wind_gusts_10m),
      windDirectionDeg: numOrNull(c.wind_direction_10m),
      windSpeed100mKmh: wind100,
      windDirection100mDeg: windDir100,
      visibilityM: numOrNull(c.visibility),
      cloudCoverPct: numOrNull(c.cloud_cover),
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
  if (!isValidCoordinate({ latitude: lat, longitude: lon })) {
    throw recordProviderError(new WeatherError("invalid-input", "Coordenadas inválidas"));
  }
  const requestedAt = new Date().toISOString();
  const url = buildWeatherUrl(lat, lon);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw recordProviderError(new WeatherError("timeout", "Timeout al consultar Open-Meteo"));
    }
    throw recordProviderError(new WeatherError("offline", "No se pudo contactar Open-Meteo"));
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw recordProviderError(
      new WeatherError("http", `HTTP ${res.status}`, res.status)
    );
  }
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw recordProviderError(
      new WeatherError("invalid-response", "Respuesta JSON inválida de Open-Meteo")
    );
  }
  let data: OpenMeteoResponse;
  try {
    data = parseOpenMeteoResponse(raw);
  } catch (err) {
    throw recordProviderError(
      err instanceof WeatherError
        ? err
        : new WeatherError("invalid-response", "Respuesta incompleta de Open-Meteo")
    );
  }
  const snapshot = mapWeatherResponse(data);
  const freshness = deriveWeatherFreshness({
    dataTime: data.current.time,
    utcOffsetSeconds: data.utc_offset_seconds,
  });
  return {
    ...snapshot,
    meta: {
      source: "Open-Meteo",
      requestedAt,
      receivedAt: new Date().toISOString(),
      dataTime: data.current.time,
      status: freshness.status,
    },
  };
}

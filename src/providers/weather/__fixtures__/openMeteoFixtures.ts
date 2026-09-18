/**
 * Fixtures estáticos de respuestas de Open-Meteo para tests de regresión.
 * NO se llama a Internet en `npm test`. Estos payloads representativos congelan
 * el contrato actual del proveedor y aseguran que un cambio de esquema falle
 * temprano ("invalid-response") en lugar de propagar valores corruptos a la UI.
 */

export const completeCurrent = {
  time: "2026-08-26T11:00",
  temperature_2m: 13.2,
  relative_humidity_2m: 82,
  precipitation: 0.3,
  weather_code: 61,
  wind_speed_10m: 13,
  wind_gusts_10m: 20,
  wind_direction_10m: 330,
  visibility: 8000,
  cloud_cover: 45,
};

export const completeHourly = {
  time: ["2026-08-26T10:00", "2026-08-26T11:00", "2026-08-26T12:00"],
  temperature_2m: [11.5, 13.2, 14.1],
  relative_humidity_2m: [85, 82, 79],
  precipitation: [0.1, 0.3, 0.0],
  weather_code: [3, 61, 2],
  wind_speed_10m: [10, 13, 15],
  wind_gusts_10m: [16, 20, 24],
  wind_direction_10m: [325, 330, 340],
  wind_speed_100m: [22, 24.5, 27],
  wind_direction_100m: [340, 345, 350],
  visibility: [9000, 8000, 7500],
  cloud_cover: [40, 45, 60],
};

/** Respuesta completa con timezone válida. */
export const fullPayload: Record<string, unknown> = {
  current: completeCurrent,
  hourly: completeHourly,
  timezone: "America/Santiago",
  timezone_abbreviation: "-03",
  utc_offset_seconds: -10800,
};

/** `current` incompleto: los campos anulables faltan y deben quedar como null. */
export const currentIncompletePayload: Record<string, unknown> = {
  current: {
    time: "2026-08-26T11:00",
    weather_code: 3,
  },
};

/** Respuesta mínima aceptable: solo `current` con hora y weather_code. */
export const minimalAcceptablePayload: Record<string, unknown> = {
  current: {
    time: "2026-08-26T11:00",
    temperature_2m: null,
    relative_humidity_2m: null,
    precipitation: null,
    weather_code: 0,
    wind_speed_10m: null,
    wind_gusts_10m: null,
    wind_direction_10m: null,
    visibility: null,
    cloud_cover: null,
  },
};

/** Arrays horarios con longitudes diferentes entre sí (series cortadas). */
export const raggedHourlyPayload: Record<string, unknown> = {
  current: completeCurrent,
  hourly: {
    time: ["2026-08-26T10:00", "2026-08-26T11:00", "2026-08-26T12:00"],
    temperature_2m: [11.5, 13.2],
    wind_speed_100m: [22],
    cloud_cover: [40, 45, 60, 70],
  },
};

/** Valores null + valores no numéricos que deben normalizarse a null. */
export const nullishPayload: Record<string, unknown> = {
  current: {
    time: "2026-08-26T11:00",
    weather_code: 2,
    temperature_2m: null,
    relative_humidity_2m: "n/a",
    precipitation: 0,
    wind_speed_10m: Number.NaN,
    wind_gusts_10m: Number.POSITIVE_INFINITY,
    wind_direction_10m: 0,
    visibility: 10000,
    cloud_cover: null,
  },
  hourly: {
    time: ["2026-08-26T11:00"],
    temperature_2m: ["not-a-number"],
  },
};

/** Respuesta sin timezone ni utc_offset. */
export const noTimezonePayload: Record<string, unknown> = {
  current: completeCurrent,
  hourly: completeHourly,
};

/** Respuesta con timezone pero sin utc_offset explícito. */
export const timezoneNoOffsetPayload: Record<string, unknown> = {
  current: completeCurrent,
  hourly: completeHourly,
  timezone: "Pacific/Easter",
  timezone_abbreviation: "-05",
};

/** Estructuras inválidas que deben producir invalid-response. */
export const invalidPayloads: unknown[] = [
  null,
  [],
  {},
  { current: null },
  { current: "nope" },
  { current: { time: 123 } },
  { current: { time: "" } },
  { current: { time: "2026-08-26T11:00", weather_code: "61" } },
  { current: { time: "2026-08-26T11:00", weather_code: Number.NaN } },
  { current: { time: "2026-08-26T11:00", weather_code: 0 }, hourly: "broken" },
  {
    current: { time: "2026-08-26T11:00", weather_code: 0 },
    hourly: { time: "2026-08-26T10:00" },
  },
];
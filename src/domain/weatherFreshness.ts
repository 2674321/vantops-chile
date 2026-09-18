import type { DataStatus } from "./sourceMeta";
import { naiveLocalToEpochMs } from "./weatherTime";

/** Antigüedad a partir de la cual la observación actual deja de ser "updated". */
export const WEATHER_STALE_AFTER_MINUTES = 90;

/**
 * Tolerancia para diferencias de reloj. Un `dataTime` levemente en el futuro se
 * considera reciente (edad 0); más allá de este margen se trata como anomalía.
 */
export const WEATHER_FUTURE_TOLERANCE_MINUTES = 120;

export interface WeatherFreshness {
  status: DataStatus;
  ageMinutes: number | null;
  futureAnomaly: boolean;
  validTimestamp: boolean;
}

/**
 * Deriva la frescura meteorológica a partir del instante real del dataset y no
 * del momento de recepción. Así, una respuesta entregada por el Service Worker
 * desde caché no se presenta como "actualizada ahora" si la medición es antigua.
 */
export function deriveWeatherFreshness(input: {
  dataTime: string | null | undefined;
  utcOffsetSeconds?: number | null;
  now?: Date;
  staleAfterMinutes?: number;
}): WeatherFreshness {
  const nowMs = (input.now ?? new Date()).getTime();
  const staleAfter = input.staleAfterMinutes ?? WEATHER_STALE_AFTER_MINUTES;
  const offset = input.utcOffsetSeconds ?? 0;
  const epoch =
    input.dataTime != null
      ? naiveLocalToEpochMs(input.dataTime, offset)
      : null;

  if (epoch === null) {
    return {
      status: "no-data",
      ageMinutes: null,
      futureAnomaly: false,
      validTimestamp: false,
    };
  }

  const deltaMinutes = (nowMs - epoch) / 60_000;
  if (deltaMinutes < -WEATHER_FUTURE_TOLERANCE_MINUTES) {
    return {
      status: "error",
      ageMinutes: 0,
      futureAnomaly: true,
      validTimestamp: true,
    };
  }

  const ageMinutes = Math.max(0, Math.round(deltaMinutes));
  return {
    status: ageMinutes <= staleAfter ? "updated" : "stale",
    ageMinutes,
    futureAnomaly: false,
    validTimestamp: true,
  };
}

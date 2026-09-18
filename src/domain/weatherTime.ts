const HAS_TIMEZONE_DESIGNATOR = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Convierte una hora local "naive" (sin offset) entregada por Open-Meteo junto
 * con `utc_offset_seconds` a un instante absoluto en milisegundos.
 *
 * Devuelve null si el texto no representa una fecha válida.
 */
export function naiveLocalToEpochMs(
  timeISO: string,
  utcOffsetSeconds: number
): number | null {
  if (typeof timeISO !== "string" || timeISO.trim() === "") return null;
  const normalized = timeISO.trim();
  const hasExplicitZone = HAS_TIMEZONE_DESIGNATOR.test(normalized);
  const parsed = Date.parse(hasExplicitZone ? normalized : `${normalized}Z`);
  if (Number.isNaN(parsed)) return null;
  return hasExplicitZone ? parsed : parsed - utcOffsetSeconds * 1000;
}

/**
 * Etiqueta horaria para mostrar en la UI. El texto de Open-Meteo ya viene en
 * la zona horaria del punto de operación, por lo que se muestra tal cual y se
 * evita reinterpretarlo con la zona del navegador.
 */
export function formatWeatherHourLabel(timeISO: string): string {
  const match = timeISO.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : timeISO;
}

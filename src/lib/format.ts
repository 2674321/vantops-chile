/**
 * Formato de hora para instantes asociados a una ubicación.
 *
 * Cuando el proveedor entrega el offset UTC del lugar (p. ej. Open-Meteo
 * timezone=auto), la hora se muestra en el huso de la ubicación y no en el
 * huso del dispositivo. Si no hay offset, se usa el huso local del navegador.
 */
export function formatClockTime(
  date: Date | null | undefined,
  utcOffsetSeconds?: number
): string {
  if (!date || Number.isNaN(date.getTime())) return "—";
  if (typeof utcOffsetSeconds === "number" && Number.isFinite(utcOffsetSeconds)) {
    const shifted = new Date(date.getTime() + utcOffsetSeconds * 1000);
    const hh = String(shifted.getUTCHours()).padStart(2, "0");
    const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

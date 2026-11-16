const pad2 = (value: number) => String(value).padStart(2, "0");

export function isoToLocalDatetimeInput(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) throw new Error("Fecha ISO inválida");
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function localDatetimeInputToIso(input: string): string {
  const date = new Date(input);
  if (!input || !Number.isFinite(date.getTime())) throw new Error("Hora local inválida");
  return date.toISOString();
}

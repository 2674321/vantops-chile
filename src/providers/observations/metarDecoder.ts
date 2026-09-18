import type { CloudLayer, MetarObservation } from "../../domain/observation";

const PHENOMENON_MAP: Record<string, string> = {
  RA: "lluvia",
  SN: "nieve",
  DZ: "llovizna",
  TS: "tormenta",
  GR: "granizo",
  GS: "granizo pequeño",
  BR: "neblina",
  FG: "niebla",
  HZ: "bruma",
  FU: "humo",
  DU: "polvo",
  SA: "arena",
  FZ: "congelamiento",
};

function ktToKmh(kt: number): number {
  return Math.round(kt * 1.852);
}

const FUTURE_TOLERANCE_MS = 90 * 60_000;

/**
 * Convierte el grupo DDHHMMZ del METAR a un instante absoluto UTC.
 *
 * El día/mes/año no vienen en el METAR, por lo que se infieren a partir de
 * `now` (UTC): se asume el mes actual y, si el resultado queda en el futuro
 * más allá de una tolerancia por desfase de reloj, se retrocede de mes (lo
 * que también resuelve cambios de día/mes/año al cruzar límites).
 *
 * Devuelve "" cuando no hay un timestamp válido.
 */
export function parseMetarObservedAt(
  raw: string,
  now: Date = new Date()
): string {
  const match = raw.match(/\b(\d{2})(\d{2})(\d{2})Z\b/);
  if (!match) return "";
  const day = Number.parseInt(match[1], 10);
  const hour = Number.parseInt(match[2], 10);
  const minute = Number.parseInt(match[3], 10);
  if (day < 1 || day > 31 || hour > 23 || minute > 59) return "";

  const nowMs = now.getTime();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  let observedMs = Date.UTC(year, month, day, hour, minute, 0);
  if (observedMs - nowMs > FUTURE_TOLERANCE_MS) {
    observedMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  }
  if (observedMs - nowMs > FUTURE_TOLERANCE_MS) {
    observedMs = Date.UTC(year, month - 2, day, hour, minute, 0);
  }
  return new Date(observedMs).toISOString();
}

function parseMetersOrCavok(
  text: string,
  windMatch: RegExpMatchArray | null
): { meters: number | null; label: string } {
  if (/CAVOK/.test(text)) return { meters: 10_000, label: "≥10 km (CAVOK)" };
  if (!windMatch) return { meters: null, label: "—" };
  const afterWind = text.slice(
    (windMatch.index ?? 0) + windMatch[0].length
  );
  const visMatch = afterWind.match(/\b(\d{4})\b/);
  if (visMatch) {
    const val = Number.parseInt(visMatch[1], 10);
    if (val === 9999) return { meters: 10_000, label: "≥10 km" };
    return { meters: val, label: `${val} m` };
  }
  return { meters: null, label: "—" };
}

export function decodeMetar(raw: string): MetarObservation {
  const stripped = raw.replace(/^(METAR|SPECI)\s+/, "");
  const station = stripped.slice(0, 4);
  const windMatch = stripped.match(
    /\b(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT\b/
  );
  let windDirDeg: number | null = null;
  let windKmh: number | null = null;
  let gustKmh: number | null = null;
  if (windMatch) {
    windDirDeg = windMatch[1] === "VRB" ? null : Number.parseInt(windMatch[1], 10);
    windKmh = ktToKmh(Number.parseInt(windMatch[2], 10));
    if (windMatch[3]) gustKmh = ktToKmh(Number.parseInt(windMatch[3], 10));
  }
  const { meters: visibilityM, label: visibilityLabel } =
    parseMetersOrCavok(stripped, windMatch);
  const tempMatch = stripped.match(/\b(M?\d{2})\/(M?\d{2})\b/);
  const parseTemp = (s: string | undefined): number | null =>
    s == null ? null : s.startsWith("M")
      ? -Number.parseInt(s.slice(1), 10)
      : Number.parseInt(s, 10);
  const tempC = parseTemp(tempMatch?.[1]);
  const dewC = parseTemp(tempMatch?.[2]);
  const qnhMatch = stripped.match(/\bQ(\d{4})\b/);
  const qnhHpa = qnhMatch ? Number.parseInt(qnhMatch[1], 10) : null;
  const clouds: CloudLayer[] = [];
  const cloudRe = /\b(FEW|SCT|BKN|OVC)(\d{3})(?:CB|TCU)?\b/g;
  let cm: RegExpExecArray | null = cloudRe.exec(stripped);
  while (cm !== null) {
    clouds.push({
      cover: cm[1] as CloudLayer["cover"],
      feet: Number.parseInt(cm[2], 10) * 100,
    });
    cm = cloudRe.exec(stripped);
  }
  const phenomena: string[] = [];
  for (const code of Object.keys(PHENOMENON_MAP)) {
    const re = new RegExp(`\\b${code}\\b`);
    if (re.test(stripped)) phenomena.push(PHENOMENON_MAP[code]);
  }
  return {
    station,
    observedAtISO: "",
    observedAtLocal: "",
    windDirDeg,
    windKmh,
    gustKmh,
    visibilityM,
    visibilityLabel,
    tempC,
    dewC,
    qnhHpa,
    clouds,
    phenomena,
    raw,
  };
}

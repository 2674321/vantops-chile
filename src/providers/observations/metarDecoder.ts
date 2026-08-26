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

/**
 * METAR reales/representativos sanitizados para tests de regresión.
 * Ninguno corresponde a condiciones actuales en vivo; congelan el contrato del
 * decodificador (no la situación meteorológica real).
 */

export interface MetarFixture {
  name: string;
  raws: string[];
  expected: {
    station?: string;
    windDirDeg?: number | null;
    windKmh?: number;
    gustKmh?: number | null;
    visibilityM?: number;
    visibilityLabelContains?: string;
    qnhHpa?: number;
    tempC?: number;
    dewC?: number;
    phenomena?: string[];
    clouds?: Array<{ cover: string; feet: number }>;
  };
}

export const metarFixtures: MetarFixture[] = [
  {
    name: "METAR normal",
    raws: ["METAR SCEL 262100Z 33013KT 9999 13/10 Q1001"],
    expected: {
      station: "SCEL",
      windDirDeg: 330,
      windKmh: 24,
      visibilityM: 10000,
      tempC: 13,
      dewC: 10,
      qnhHpa: 1001,
    },
  },
  {
    name: "SPECI",
    raws: ["SPECI SCEL 260200Z 33013KT 9999 RA FEW019 SCT039 BKN070 13/10 Q1001"],
    expected: {
      station: "SCEL",
      windKmh: 24,
      visibilityM: 10000,
      phenomena: ["lluvia"],
      clouds: [
        { cover: "FEW", feet: 1900 },
        { cover: "SCT", feet: 3900 },
        { cover: "BKN", feet: 7000 },
      ],
    },
  },
  {
    name: "minutos distintos de 00",
    raws: ["METAR SCEL 172153Z 33013KT 9999 13/10 Q1001"],
    expected: { windKmh: 24 },
  },
  {
    name: "NIL",
    raws: ["METAR SCEL 260500Z 33013KT 9999 NIL"],
    expected: {},
  },
  {
    name: "visibilidad explícita",
    raws: ["METAR SCEL 261600Z 32005KT 290V010 8000 -SHRA FEW007 SCT040 OVC090 12/11 Q1014"],
    expected: { visibilityM: 8000, visibilityLabelContains: "8000 m" },
  },
  {
    name: "niebla",
    raws: ["METAR SCEL 260300Z 00000KT 0200 FG VV002 06/06 Q1020"],
    expected: { visibilityM: 200, phenomena: ["niebla"] },
  },
  {
    name: "QNH bajo",
    raws: ["METAR SCEL 260800Z 20008KT 9999 SCT020 08/05 Q0995"],
    expected: { qnhHpa: 995 },
  },
  {
    name: "viento variable",
    raws: ["METAR SCEL 260200Z VRB05KT 9999 20/10 Q1013"],
    expected: { windDirDeg: null, windKmh: 9 },
  },
  {
    name: "ráfagas",
    raws: ["METAR SCEL 260200Z 33018G28KT 9999 20/10 Q1013"],
    expected: { windKmh: 33, gustKmh: 52 },
  },
  {
    name: "calma",
    raws: ["METAR SCEL 261200Z 00000KT CAVOK 18/08 Q1018"],
    expected: { windKmh: 0, visibilityM: 10000 },
  },
  {
    name: "temperatura negativa",
    raws: ["METAR SCEL 260200Z 33010KT 9999 M05/M08 Q1025"],
    expected: { tempC: -5, dewC: -8 },
  },
  {
    name: "CAVOK",
    raws: ["METAR SCEL 260200Z 33013KT CAVOK 20/10 Q1013"],
    expected: { visibilityM: 10000, visibilityLabelContains: "CAVOK" },
  },
];

/** Cadenas malformadas o vacías que el provider debe tratar como no-data. */
export const malformedMetarStrings: string[] = [
  "",
  "   ",
  "METAR SCEL",
  "METAR SCEL 260200Z",
  "estonoesunmetar",
];
import { describe, it, expect } from "vitest";
import type { FlightRecord } from "../domain/logbook/types";
import {
  CSV_BOM,
  escapeCsvField,
  toCsvRow,
  flightsToCsv,
  flightToCsvRow,
  FLIGHT_CSV_HEADERS,
} from "./csvExport";

function makeFlight(overrides: Partial<FlightRecord> = {}): FlightRecord {
  return {
    id: "f1",
    startedAt: "2026-09-17T13:05:00.000Z",
    endedAt: "2026-09-17T13:35:00.000Z",
    durationSeconds: 1830,
    coordinate: { latitude: -33.45, longitude: -70.66 },
    elevation: 512,
    aircraftSnapshot: {
      id: "a1",
      name: "Mini 4 Pro",
      manufacturer: "DJI",
      model: "Mini 4 Pro",
      type: "MULTIROTOR",
    },
    batteryStartPct: 100,
    batteryEndPct: 42,
    operationType: "PHOTOGRAPHY",
    createdAt: "2026-09-17T13:05:00.000Z",
    updatedAt: "2026-09-17T13:35:00.000Z",
    ...overrides,
  };
}

describe("escapeCsvField", () => {
  it("leaves simple values untouched", () => {
    expect(escapeCsvField("hola")).toBe("hola");
  });

  it("quotes values with commas, quotes or newlines", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('a"b')).toBe('"a""b"');
    expect(escapeCsvField("a\nb")).toBe('"a\nb"');
  });
});

describe("toCsvRow", () => {
  it("joins fields and maps null/undefined to empty", () => {
    expect(toCsvRow(["a", null, undefined, 3])).toBe("a,,,3");
  });
});

describe("flightsToCsv", () => {
  it("starts with a BOM and includes headers", () => {
    const csv = flightsToCsv([]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv).toContain("Fecha inicio");
    expect(csv).toContain("Longitud");
  });

  it("uses CRLF line endings and a trailing newline", () => {
    const csv = flightsToCsv([makeFlight()]);
    expect(csv).toContain("\r\n");
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });

  it("emits one row per flight", () => {
    const csv = flightsToCsv([makeFlight(), makeFlight({ id: "f2" })]);
    const rows = csv.replace(CSV_BOM, "").split("\r\n").filter(Boolean);
    expect(rows).toHaveLength(3);
  });
});

describe("flightToCsvRow", () => {
  it("maps flight fields and human labels", () => {
    const row = flightToCsvRow(makeFlight());
    const cells = row.split(",");
    expect(row).toContain("Fotografía");
    expect(row).toContain("DJI");
    expect(row).toContain("-33.45");
    expect(row).toContain("-70.66");
    expect(cells).toContain("30.5");
  });

  it("formats incidents with labels and notes", () => {
    const row = flightToCsvRow(
      makeFlight({
        incidents: [
          { id: "i1", type: "BATTERY", notes: "descarga rápida" },
          { id: "i2", type: "RTH" },
        ],
      })
    );
    expect(row).toContain("Batería: descarga rápida; RTH");
  });

  it("escapes notes containing commas and quotes", () => {
    const row = flightToCsvRow(makeFlight({ notes: 'Viento "fuerte", se decidió aterrizar' }));
    expect(row).toContain('"Viento ""fuerte"", se decidió aterrizar"');
  });

  it("omits optional fields cleanly when missing", () => {
    const row = flightToCsvRow(
      makeFlight({
        aircraftSnapshot: undefined,
        operationType: undefined,
        elevation: undefined,
        batteryStartPct: undefined,
        batteryEndPct: undefined,
        incidents: undefined,
        notes: undefined,
      })
    );
    expect(row.split(",")).toHaveLength(FLIGHT_CSV_HEADERS.length);
  });
});

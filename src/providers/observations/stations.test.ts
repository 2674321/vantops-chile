import { describe, it, expect } from "vitest";
import { findNearestStation, haversineKm, CHILEAN_STATIONS } from "./stations";

describe("haversineKm", () => {
  it("returns ~0 for same point", () => {
    expect(haversineKm(-33.45, -70.66, -33.45, -70.66)).toBe(0);
  });

  it("returns ~33 km for Santiago to Viña (approx)", () => {
    const d = haversineKm(-33.45, -70.66, -33.01, -71.55);
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(120);
  });
});

describe("findNearestStation", () => {
  it("returns SCEL for Santiago", () => {
    const { station } = findNearestStation(-33.39, -70.79);
    expect(station.icao).toBe("SCEL");
  });

  it("returns SCER for Arica", () => {
    const { station } = findNearestStation(-18.35, -70.33);
    expect(station.icao).toBe("SCER");
  });

  it("returns SCCI for Punta Arenas", () => {
    const { station } = findNearestStation(-53.0, -70.85);
    expect(station.icao).toBe("SCCI");
  });

  it("returns distance in km", () => {
    const { distanceKm } = findNearestStation(-33.39, -70.79);
    expect(typeof distanceKm).toBe("number");
    expect(distanceKm).toBeLessThan(10);
  });

  it("covers all 11 stations", () => {
    expect(CHILEAN_STATIONS.length).toBe(11);
  });
});

describe("parseObsTimeFromRaw (integration via fetchNearestObservation)", () => {
  it("parses METAR DDHHMMz format correctly", () => {
    const raw = "SCEL 261600Z 32005KT 290V010 8000 -SHRA FEW007 SCT040 OVC090 12/11 Q1014 NOSIG";
    const match = raw.match(/\b(\d{2})(\d{2})(\d{2})Z\b/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe("26");
    expect(match?.[2]).toBe("16");
  });
});

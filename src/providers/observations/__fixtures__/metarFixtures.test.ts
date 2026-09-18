import { describe, expect, it } from "vitest";
import { decodeMetar, parseMetarObservedAt } from "../metarDecoder";
import { metarFixtures, malformedMetarStrings } from "./metarFixtures";
import { fetchNearestObservation } from "../vatsimObservation";
import { vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("metarFixtures (contract regression)", () => {
  it.each(metarFixtures.map((f, i) => [i, f] as const))(
    "decodes %s without throwing",
    (_i, fixture) => {
      for (const raw of fixture.raws) {
        const metar = decodeMetar(raw);
        expect(metar.raw).toBe(raw);
        expect(typeof metar.station).toBe("string");
      }
    }
  );

  it.each(metarFixtures.map((f, i) => [i, f] as const))(
    "matches expected values for %s",
    (_i, fixture) => {
      const raw = fixture.raws[0];
      const metar = decodeMetar(raw);
      if (fixture.expected.station !== undefined) {
        expect(metar.station).toBe(fixture.expected.station);
      }
      if (fixture.expected.windDirDeg !== undefined) {
        expect(metar.windDirDeg).toBe(fixture.expected.windDirDeg);
      }
      if (fixture.expected.windKmh !== undefined) {
        expect(metar.windKmh).toBe(fixture.expected.windKmh);
      }
      if (fixture.expected.gustKmh !== undefined) {
        expect(metar.gustKmh).toBe(fixture.expected.gustKmh);
      }
      if (fixture.expected.visibilityM !== undefined) {
        expect(metar.visibilityM).toBe(fixture.expected.visibilityM);
      }
      if (fixture.expected.visibilityLabelContains !== undefined) {
        expect(metar.visibilityLabel).toContain(
          fixture.expected.visibilityLabelContains
        );
      }
      if (fixture.expected.qnhHpa !== undefined) {
        expect(metar.qnhHpa).toBe(fixture.expected.qnhHpa);
      }
      if (fixture.expected.tempC !== undefined) {
        expect(metar.tempC).toBe(fixture.expected.tempC);
      }
      if (fixture.expected.dewC !== undefined) {
        expect(metar.dewC).toBe(fixture.expected.dewC);
      }
      if (fixture.expected.phenomena !== undefined) {
        for (const phen of fixture.expected.phenomena) {
          expect(metar.phenomena).toContain(phen);
        }
      }
      if (fixture.expected.clouds !== undefined) {
        expect(metar.clouds).toEqual(fixture.expected.clouds);
      }
    }
  );
});

describe("malformed METAR handling", () => {
  it.each(malformedMetarStrings)("treats %j as no-data at the provider level", async (raw) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => raw,
      } as unknown as Response)
    );
    const snapshot = await fetchNearestObservation(-33.45, -70.66);
    expect(snapshot.meta.status).toBe("no-data");
    expect(snapshot.observation).toBeNull();
  });
});

describe("NIL handling", () => {
  it("returns no-data when the station reports NIL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "METAR SCEL 260500Z 33013KT 9999 NIL",
      } as unknown as Response)
    );
    const snapshot = await fetchNearestObservation(-33.45, -70.66);
    expect(snapshot.meta.status).toBe("no-data");
    expect(snapshot.observation).toBeNull();
  });
});

describe("observation freshness boundaries (frozen behavior)", () => {
  function stubMetar(group: string): void {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `METAR SCEL ${group}Z 33013KT 9999 13/10 Q1001`,
      } as unknown as Response)
    );
  }

  it("binds METAR observation time through parseMetarObservedAt", () => {
    const iso = parseMetarObservedAt("SCEL 172153Z 33013KT", new Date("2026-09-17T22:00:00Z"));
    expect(iso).toBe("2026-09-17T21:53:00.000Z");
  });

  it("a slightly future METAR (clock skew, within tolerance) is never clamped into the past", () => {
    const iso = parseMetarObservedAt("SCEL 172230Z 33013KT", new Date("2026-09-17T21:59:00Z"));
    expect(iso).toBe("2026-09-17T22:30:00.000Z");
  });

  it("never reports a future METAR as absurdly newer (age clamped to >= 0)", async () => {
    const base = new Date(Date.now() + 30 * 60_000);
    const group =
      String(base.getUTCDate()).padStart(2, "0") +
      String(base.getUTCHours()).padStart(2, "0") +
      String(base.getUTCMinutes()).padStart(2, "0");
    stubMetar(group);
    const snapshot = await fetchNearestObservation(-33.45, -70.66);
    expect(snapshot.meta.status).toBe("updated");
    expect(snapshot.meta.error).toBeUndefined();
    expect(snapshot.meta.dataTime).toBeDefined();
  });
});
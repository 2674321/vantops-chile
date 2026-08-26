import { describe, it, expect } from "vitest";
import { decodeMetar } from "./metarDecoder";

const SPECI_EXAMPLE =
  "SPECI SCEL 260200Z 33013KT 9999 RA FEW019 SCT039 BKN070 13/10 Q1001";

describe("decodeMetar", () => {
  it("parses station code", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.station).toBe("SCEL");
  });

  it("parses wind direction and speed", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.windDirDeg).toBe(330);
    expect(m.windKmh).toBe(24);
    expect(m.gustKmh).toBeNull();
  });

  it("parses visibility (9999 = >=10 km)", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.visibilityM).toBe(10000);
    expect(m.visibilityLabel).toContain("10");
  });

  it("parses temperature and dew point", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.tempC).toBe(13);
    expect(m.dewC).toBe(10);
  });

  it("parses QNH", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.qnhHpa).toBe(1001);
  });

  it("parses cloud layers", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.clouds).toHaveLength(3);
    expect(m.clouds[0]).toEqual({ cover: "FEW", feet: 1900 });
    expect(m.clouds[1]).toEqual({ cover: "SCT", feet: 3900 });
    expect(m.clouds[2]).toEqual({ cover: "BKN", feet: 7000 });
  });

  it("detects phenomena (RA = lluvia)", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.phenomena).toContain("lluvia");
  });

  it("returns raw text", () => {
    const m = decodeMetar(SPECI_EXAMPLE);
    expect(m.raw).toBe(SPECI_EXAMPLE);
  });

  it("handles CAVOK visibility", () => {
    const m = decodeMetar("METAR SCEL 260200Z 33013KT CAVOK 20/10 Q1013");
    expect(m.visibilityM).toBe(10000);
    expect(m.visibilityLabel).toContain("CAVOK");
  });

  it("handles gusts", () => {
    const m = decodeMetar("METAR SCEL 260200Z 33018G28KT 9999 20/10 Q1013");
    expect(m.windKmh).toBe(33);
    expect(m.gustKmh).toBe(52);
  });

  it("handles VRB wind", () => {
    const m = decodeMetar("METAR SCEL 260200Z VRB05KT 9999 20/10 Q1013");
    expect(m.windDirDeg).toBeNull();
    expect(m.windKmh).toBe(9);
  });

  it("handles negative temperatures", () => {
    const m = decodeMetar("METAR SCEL 260200Z 33010KT 9999 M05/M08 Q1025");
    expect(m.tempC).toBe(-5);
    expect(m.dewC).toBe(-8);
  });

  it("parses visibility with variable wind direction", () => {
    const m = decodeMetar("METAR SCEL 261600Z 32005KT 290V010 8000 -SHRA FEW007 SCT040 OVC090 12/11 Q1014");
    expect(m.visibilityM).toBe(8000);
    expect(m.visibilityLabel).toBe("8000 m");
  });
});

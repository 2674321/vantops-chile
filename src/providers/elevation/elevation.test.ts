import { describe, it, expect } from "vitest";
import { buildElevationUrl } from "./openMeteoElevation";

describe("buildElevationUrl", () => {
  it("builds correct URL", () => {
    const url = buildElevationUrl(-33.45, -70.66);
    expect(url).toContain("latitude=-33.45");
    expect(url).toContain("longitude=-70.66");
    expect(url).toContain("api.open-meteo.com/v1/elevation");
  });
});

describe("fetchElevation integration (real API)", () => {
  it("returns a number for Santiago", async () => {
    const { fetchElevation } = await import("./openMeteoElevation");
    const result = await fetchElevation(-33.45, -70.66);
    expect(typeof result.meters).toBe("number");
    expect(result.meters).toBeGreaterThan(0);
    expect(result.meters).toBeLessThan(10000);
    expect(result.meta.source).toBe("Open-Meteo Elevation");
    expect(result.meta.status).toBe("updated");
  });

  it("rejects invalid coordinates", async () => {
    const { fetchElevation } = await import("./openMeteoElevation");
    await expect(fetchElevation(999, -70.66)).rejects.toThrow(
      "Coordenadas inválidas"
    );
  });
});

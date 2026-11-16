import { describe, expect, it } from "vitest";
import {
  BASEMAP_CATALOG,
  DEFAULT_BASEMAP_ID,
  isBasemapId,
  resolveBasemap,
} from "./basemap";

describe("basemap catalog", () => {
  it("keeps OSM as a safe fallback", () => {
    expect(resolveBasemap("satellite").id).toBe(DEFAULT_BASEMAP_ID);
  });

  it("exposes topography but not unlicensed satellite imagery", () => {
    expect(resolveBasemap("open-topo").kind).toBe("terrain");
    expect(BASEMAP_CATALOG.find((item) => item.id === "satellite")).toMatchObject({
      enabled: false,
      url: null,
    });
  });

  it("validates persisted identifiers", () => {
    expect(isBasemapId("open-topo")).toBe(true);
    expect(isBasemapId("pirated-satellite")).toBe(false);
  });
});

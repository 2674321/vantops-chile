import { describe, expect, it } from "vitest";
import type { SavedPlace } from "./logbook/types";
import type { MapRadiusZone } from "./operationalMap";
import { effectiveMapSelection } from "./effectiveMapSelection";

const center = { latitude: -33.4, longitude: -70.6 };

describe("effectiveMapSelection", () => {
  it("uses the selected pin instead of a stale map center", () => {
    const pin = {
      id: "pin-1",
      name: "Despegue norte",
      coordinate: { latitude: -32, longitude: -71 },
      createdAt: "2026-11-16T00:00:00.000Z",
      updatedAt: "2026-11-16T00:00:00.000Z",
    } satisfies SavedPlace;
    expect(effectiveMapSelection(center, "manual-coordinate", undefined, pin, null)).toMatchObject({
      coordinate: pin.coordinate,
      placeId: pin.id,
      source: "saved-place",
    });
  });

  it("uses an explicitly selected zone when no pin is active", () => {
    const zone = {
      id: "zone-1",
      name: "Zona principal",
      center: { latitude: -31, longitude: -70 },
      radiusMeters: 500,
      color: "#38bdf8",
      visible: true,
      fillOpacity: 0.12,
    } satisfies MapRadiusZone;
    expect(effectiveMapSelection(center, "manual-coordinate", undefined, null, zone)).toMatchObject({
      coordinate: zone.center,
      zoneId: zone.id,
    });
  });
});

import type { Coordinate } from "./coordinate";
import type { SavedPlace } from "./logbook/types";
import type { LocationSource } from "./locationSelection";
import type { MapRadiusZone } from "./operationalMap";

export interface EffectiveMapSelection {
  coordinate: Coordinate;
  source: LocationSource;
  label?: string;
  placeId?: string;
  zoneId?: string;
}

export function effectiveMapSelection(
  center: Coordinate,
  source: LocationSource,
  label: string | undefined,
  selectedPin: SavedPlace | null,
  selectedZone: MapRadiusZone | null,
): EffectiveMapSelection {
  if (selectedPin) {
    return {
      coordinate: selectedPin.coordinate,
      source: "saved-place",
      label: selectedPin.name,
      placeId: selectedPin.id,
    };
  }
  if (selectedZone) {
    return {
      coordinate: selectedZone.center,
      source: "map-click",
      label: selectedZone.name,
      zoneId: selectedZone.id,
    };
  }
  return { coordinate: center, source, label };
}

import { describe, it, expect } from "vitest";
import type { SavedPlace } from "../../domain/logbook/types";

describe("SavedPlace structure", () => {
  it("can create a valid place record", () => {
    const now = new Date().toISOString();
    const place: SavedPlace = {
      id: "place-test-1",
      name: "Club de vuelo",
      coordinate: { latitude: -33.4521, longitude: -70.6536 },
      createdAt: now,
      updatedAt: now,
    };
    expect(place.id).toBe("place-test-1");
    expect(place.name).toBe("Club de vuelo");
    expect(place.coordinate.latitude).toBe(-33.4521);
    expect(place.coordinate.longitude).toBe(-70.6536);
  });

  it("place with notes and favorite", () => {
    const now = new Date().toISOString();
    const place: SavedPlace = {
      id: "place-test-2",
      name: "Casa",
      coordinate: { latitude: -33.45, longitude: -70.65 },
      notes: "Dirección principal",
      favorite: true,
      createdAt: now,
      updatedAt: now,
    };
    expect(place.favorite).toBe(true);
    expect(place.notes).toBe("Dirección principal");
  });

  it("place without optional fields", () => {
    const now = new Date().toISOString();
    const place: SavedPlace = {
      id: "place-test-3",
      name: "Zona de práctica",
      coordinate: { latitude: -33.45, longitude: -70.65 },
      createdAt: now,
      updatedAt: now,
    };
    expect(place.notes).toBeUndefined();
    expect(place.favorite).toBeUndefined();
  });
});

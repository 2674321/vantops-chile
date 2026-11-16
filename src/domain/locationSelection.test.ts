import { describe, expect, it } from "vitest";
import { buildLocationSelection, locationSourceLabel, validateLocationSelection } from "./locationSelection";
import { destinationForPick, mapPickerPath, parseMapPickIntent } from "./mapPickIntent";

describe("shared location contract", () => {
  it("builds a traceable selection and rejects invalid coordinates", () => {
    const selection = buildLocationSelection({ latitude: -33.45, longitude: -70.66 }, "saved-place", { placeId: "p1", label: "Base" });
    expect(validateLocationSelection(selection)).toBe(true);
    expect(locationSourceLabel(selection.source)).toContain("guardado");
    expect(() => buildLocationSelection({ latitude: 91, longitude: 0 }, "map-click")).toThrow("inválida");
  });

  it("keeps map selection destinations allowlisted", () => {
    expect(parseMapPickIntent("javascript:alert(1)")).toBe("none");
    expect(mapPickerPath("flight-new")).toBe("/utilidades/mapa?pickFor=flight-new");
    expect(destinationForPick("plan-new")).toBe("/operacion/nueva");
  });
});

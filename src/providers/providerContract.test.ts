import { describe, expect, it } from "vitest";
import { ProviderError, type ProviderErrorKind } from "../domain/providerError";
import { WeatherError } from "./weather/openMeteoWeather";
import { ElevationError } from "./elevation/openMeteoElevation";
import { GeocodingError } from "./geocoding/nominatimGeocoding";
import { ObservationError } from "./observations/vatsimObservation";

/**
 * Contrato común de errores de provider: independiente de cada adapter.
 * La UI depende de `kind`, `provider` y mensajes seguros (nunca el texto
 * técnico crudo de un TypeError/SyntaxError/NetworkError).
 */

const ALL_KINDS: ProviderErrorKind[] = [
  "timeout",
  "offline",
  "http",
  "invalid-response",
  "no-data",
  "invalid-input",
];

function makeError(
  ctor: new (kind: ProviderErrorKind, message: string, status?: number) => ProviderError
): (kind: ProviderErrorKind) => ProviderError {
  return (kind) => new ctor(kind, `mensaje de ${kind}`);
}

const errorFactories: Array<{
  name: string;
  ctor: new (kind: ProviderErrorKind, message: string, status?: number) => ProviderError;
  kindsSupported: ProviderErrorKind[];
}> = [
  {
    name: "WeatherError",
    ctor: WeatherError,
    kindsSupported: ["invalid-input", "timeout", "offline", "http", "invalid-response"],
  },
  {
    name: "ElevationError",
    ctor: ElevationError,
    kindsSupported: ["invalid-input", "timeout", "offline", "http", "invalid-response", "no-data"],
  },
  {
    name: "GeocodingError",
    ctor: GeocodingError,
    kindsSupported: ["timeout", "offline", "http", "invalid-response"],
  },
  {
    name: "ObservationError",
    ctor: ObservationError,
    kindsSupported: ["timeout", "offline", "http"],
  },
];

describe("ProviderError contract", () => {
  it.each(errorFactories.map((f, i) => [i, f] as const))(
    "%s is an instanceof ProviderError and exposes provider + kind",
    (_i, { ctor, kindsSupported }) => {
      const make = makeError(ctor);
      for (const kind of kindsSupported) {
        const err = make(kind);
        expect(err).toBeInstanceOf(ProviderError);
        expect(err.kind).toBe(kind);
        expect(typeof err.provider).toBe("string");
        expect(err.provider.length).toBeGreaterThan(0);
        expect(err.message).toContain(kind);
        // No expone el error técnico crudo.
        expect(err.message).not.toMatch(/TypeError|SyntaxError|NetworkError|Failed to fetch|at /);
      }
    }
  );

  it("exposes an HTTP status only when the kind is http", () => {
    const err = new WeatherError("http", "HTTP 503", 503);
    expect(err.status).toBe(503);
    const noStatus = new WeatherError("offline", "sin conexión");
    expect(noStatus.status).toBeUndefined();
  });

  it("each advertised kind is a valid ProviderErrorKind", () => {
    for (const kind of ALL_KINDS) {
      expect(["timeout", "offline", "http", "invalid-response", "no-data", "invalid-input"]).toContain(kind);
    }
  });
});

describe("advertised error kinds (contract per adapter)", () => {
  it.each(errorFactories.map((f, i) => [i, f] as const))(
    "%s supports the kinds it declares",
    (_i, { ctor, kindsSupported }) => {
      for (const kind of kindsSupported) {
        const err = new ctor(kind, "m");
        expect(err).toBeInstanceOf(ProviderError);
        expect(err.kind).toBe(kind);
      }
    }
  );
});
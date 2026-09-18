import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readDiagnostics,
  recordProviderFailure,
  recordProviderError,
  clearDiagnostics,
  parseDiagnostics,
  MAX_DIAGNOSTIC_EVENTS,
  DIAGNOSTICS_STORAGE_KEY,
} from "./providerDiagnostic";
import { WeatherError } from "../providers/weather/openMeteoWeather";

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  clearDiagnostics();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("providerDiagnostic", () => {
  it("records a failure and reads it back", () => {
    recordProviderFailure("Open-Meteo", "timeout", new Date("2026-09-18T12:00:00Z"));
    const entries = readDiagnostics();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      provider: "Open-Meteo",
      kind: "timeout",
      timestamp: "2026-09-18T12:00:00.000Z",
    });
  });

  it("caps the stored history at MAX_DIAGNOSTIC_EVENTS (FIFO tail)", () => {
    for (let i = 0; i < MAX_DIAGNOSTIC_EVENTS + 10; i++) {
      recordProviderFailure("Open-Meteo", "offline", new Date(Date.UTC(2026, 8, 1, i)));
    }
    const entries = readDiagnostics();
    expect(entries.length).toBe(MAX_DIAGNOSTIC_EVENTS);
    expect(entries[0].timestamp).toBe(
      new Date(Date.UTC(2026, 8, 1, 10)).toISOString()
    );
  });

  it("recordProviderError records and returns the same error", () => {
    const err = new WeatherError("http", "HTTP 503", 503);
    const out = recordProviderError(err);
    expect(out).toBe(err);
    expect(readDiagnostics()).toHaveLength(1);
    expect(readDiagnostics()[0]).toMatchObject({
      provider: "Open-Meteo",
      kind: "http",
    });
  });

  it("parseDiagnostics filters malformed entries without throwing", () => {
    const clean = parseDiagnostics([
      { provider: "P", kind: "timeout", timestamp: "2026-09-18T00:00:00Z" },
      { provider: 12, kind: "timeout", timestamp: "x" },
      null,
      "junk",
      { provider: "P", kind: "no-data" },
      [],
    ]);
    expect(clean).toHaveLength(1);
  });

  it("never throws when localStorage is unavailable", () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("SecurityError: The operation is insecure");
      },
    });
    try {
      expect(() => recordProviderFailure("N", "offline")).not.toThrow();
      expect(readDiagnostics()).toEqual([]);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });

  it("stores under the expected key", () => {
    recordProviderFailure("VATSIM METAR", "timeout");
    expect(JSON.parse(localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) ?? "[]")).toHaveLength(1);
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildGeocodingUrl,
  normalizeGeocodingResponse,
  searchLocation,
  clearGeocodingCache,
  NOMINATIM_ENDPOINT,
} from "./nominatimGeocoding";

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response;
}

beforeEach(() => {
  clearGeocodingCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildGeocodingUrl", () => {
  it("includes query, format, limit and language", () => {
    const url = buildGeocodingUrl("Aeródromo Tobalaba", { limit: 3 });
    expect(url.startsWith(NOMINATIM_ENDPOINT)).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("q")).toBe("Aeródromo Tobalaba");
    expect(params.get("format")).toBe("jsonv2");
    expect(params.get("limit")).toBe("3");
    expect(params.get("accept-language")).toContain("es");
  });

  it("adds country codes when provided", () => {
    const url = buildGeocodingUrl("Santiago", { countryCodes: ["cl"] });
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("countrycodes")).toBe("cl");
  });
});

describe("normalizeGeocodingResponse", () => {
  it("maps valid Nominatim items to Coordinate results", () => {
    const results = normalizeGeocodingResponse([
      {
        place_id: 1,
        display_name: "Santiago, Chile",
        lat: "-33.45",
        lon: "-70.66",
        category: "place",
        type: "city",
      },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      placeId: 1,
      displayName: "Santiago, Chile",
      latitude: -33.45,
      longitude: -70.66,
      category: "place",
      type: "city",
    });
  });

  it("skips items with invalid coordinates", () => {
    const results = normalizeGeocodingResponse([
      { place_id: 1, display_name: "Mal", lat: "200", lon: "0" },
      { place_id: 2, display_name: "Bien", lat: "-33", lon: "-70" },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].placeId).toBe(2);
  });

  it("skips items missing place_id or display_name", () => {
    const results = normalizeGeocodingResponse([
      { display_name: "Sin id", lat: "-33", lon: "-70" },
      { place_id: 9, lat: "-33", lon: "-70" },
    ]);
    expect(results).toHaveLength(0);
  });

  it("returns empty array for non-array payload", () => {
    expect(normalizeGeocodingResponse(null)).toEqual([]);
    expect(normalizeGeocodingResponse({})).toEqual([]);
  });
});

describe("searchLocation", () => {
  it("returns [] for empty query without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const results = await searchLocation("   ");
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("performs a single request and normalizes the response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse([
          { place_id: 1, display_name: "Santiago", lat: "-33.45", lon: "-70.66" },
        ])
      );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchLocation("Santiago");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
    expect(results[0].displayName).toBe("Santiago");
  });

  it("caches identical searches (no extra network request)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse([{ place_id: 1, display_name: "Santiago", lat: "-33.45", lon: "-70.66" }]));
    vi.stubGlobal("fetch", fetchMock);

    await searchLocation("Santiago");
    await searchLocation("Santiago");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws on HTTP errors from Nominatim", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchLocation("Viña del Mar")).rejects.toThrow(/429/);
  });

  it("enforces max 1 request per second between distinct searches", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const start = Date.now();
    await searchLocation("consulta uno");
    await searchLocation("consulta dos");
    const elapsed = Date.now() - start;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });
});
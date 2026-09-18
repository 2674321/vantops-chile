import { describe, expect, it, vi, afterEach } from "vitest";
import {
  parseOpenMeteoResponse,
  fetchWeatherSnapshot,
  mapWeatherResponse,
  WeatherError,
} from "./openMeteoWeather";
import {
  fullPayload,
  currentIncompletePayload,
  minimalAcceptablePayload,
  raggedHourlyPayload,
  nullishPayload,
  noTimezonePayload,
  timezoneNoOffsetPayload,
  invalidPayloads,
} from "./__fixtures__/openMeteoFixtures";

function jsonResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseOpenMeteoResponse", () => {
  it("accepts the full representative payload", () => {
    const parsed = parseOpenMeteoResponse(fullPayload);
    expect(parsed.current.time).toBe("2026-08-26T11:00");
    expect(parsed.timezone).toBe("America/Santiago");
    expect(parsed.utc_offset_seconds).toBe(-10800);
  });

  it("accepts a minimal acceptable payload", () => {
    expect(() => parseOpenMeteoResponse(minimalAcceptablePayload)).not.toThrow();
  });

  it("rejects a current without weather_code (non-nullable field)", () => {
    expect(
      () => parseOpenMeteoResponse({ current: { time: "2026-08-26T11:00" } })
    ).toThrow(WeatherError);
  });

  it.each(invalidPayloads.map((p, i) => [i, p] as const))(
    "rejects structurally incompatible payload #%i with invalid-response",
    (_i, payload) => {
      expect(() => parseOpenMeteoResponse(payload)).toThrow(WeatherError);
      try {
        parseOpenMeteoResponse(payload);
      } catch (err) {
        expect(err).toMatchObject({ kind: "invalid-response" });
      }
    }
  );

  it("does not reject values: a string in a nullable field still parses the container", () => {
    expect(() => parseOpenMeteoResponse(nullishPayload)).not.toThrow();
  });
});

describe("mapWeatherResponse regression fixtures", () => {
  it("keeps timezone metadata from the payload", () => {
    const mapped = mapWeatherResponse(parseOpenMeteoResponse(fullPayload));
    expect(mapped.timezone).toBe("America/Santiago");
    expect(mapped.timezoneAbbreviation).toBe("-03");
    expect(mapped.utcOffsetSeconds).toBe(-10800);
  });

  it("keeps timezone without utc offset as undefined", () => {
    const mapped = mapWeatherResponse(
      parseOpenMeteoResponse(timezoneNoOffsetPayload)
    );
    expect(mapped.timezone).toBe("Pacific/Easter");
    expect(mapped.utcOffsetSeconds).toBeUndefined();
  });

  it("returns no timezone metadata when the payload has none", () => {
    const mapped = mapWeatherResponse(parseOpenMeteoResponse(noTimezonePayload));
    expect(mapped.timezone).toBeUndefined();
    expect(mapped.timezoneAbbreviation).toBeUndefined();
    expect(mapped.utcOffsetSeconds).toBeUndefined();
  });

  it("never invents values for missing current fields (null, not 0)", () => {
    const mapped = mapWeatherResponse(
      parseOpenMeteoResponse(currentIncompletePayload)
    );
    expect(mapped.current.temperatureC).toBeNull();
    expect(mapped.current.windSpeedKmh).toBeNull();
    expect(mapped.current.visibilityM).toBeNull();
    expect(mapped.current.weatherCode).toBe(3);
    expect(mapped.current.timeISO).toBe("2026-08-26T11:00");
  });

  it("maps a minimal payload to null fields and an empty hourly list", () => {
    const mapped = mapWeatherResponse(
      parseOpenMeteoResponse(minimalAcceptablePayload)
    );
    expect(mapped.current.weatherCode).toBe(0);
    expect(mapped.current.temperatureC).toBeNull();
    expect(mapped.hourly).toHaveLength(0);
  });

  it("fills missing values in ragged hourly arrays with null, without throwing", () => {
    const mapped = mapWeatherResponse(parseOpenMeteoResponse(raggedHourlyPayload));
    expect(mapped.hourly).toHaveLength(3);
    expect(mapped.hourly[0].temperatureC).toBe(11.5);
    expect(mapped.hourly[1].temperatureC).toBe(13.2);
    expect(mapped.hourly[2].temperatureC).toBeNull();
    expect(mapped.hourly[0].windSpeed100mKmh).toBe(22);
    expect(mapped.hourly[1].windSpeed100mKmh).toBeNull();
    expect(mapped.hourly[2].cloudCoverPct).toBe(60);
    expect(mapped.hourly[2].visibilityM).toBeNull();
  });

  it("normalizes null and non-numeric values to null (no type corruption)", () => {
    const mapped = mapWeatherResponse(parseOpenMeteoResponse(nullishPayload));
    expect(mapped.current.temperatureC).toBeNull();
    expect(mapped.current.humidityPct).toBeNull();
    expect(mapped.current.windSpeedKmh).toBeNull();
    expect(mapped.current.windGustsKmh).toBeNull();
    expect(mapped.current.weatherCode).toBe(2);
    expect(mapped.hourly[0].temperatureC).toBeNull();
  });
});

describe("fetchWeatherSnapshot regression fixtures", () => {
  it("rejects structurally invalid payloads with invalid-response", async () => {
    for (const payload of invalidPayloads) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));
      await expect(fetchWeatherSnapshot(-33.45, -70.66)).rejects.toMatchObject({
        kind: "invalid-response",
      });
      vi.unstubAllGlobals();
    }
  });

  it("derives meta.dataTime from the dataset time (not receipt time)", async () => {
    const current = {
      time: "2026-08-26T11:00",
      weather_code: 0,
      temperature_2m: 5,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ current }))
    );
    const snapshot = await fetchWeatherSnapshot(-33.45, -70.66);
    expect(snapshot.meta.dataTime).toBe("2026-08-26T11:00");
    expect(snapshot.meta.receivedAt).not.toBe(snapshot.meta.dataTime);
  });

  it("marks a just-received but old dataset as stale (freshness from data)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ current: { time: "2026-08-26T11:00", weather_code: 0 } })
      )
    );
    const snapshot = await fetchWeatherSnapshot(-33.45, -70.66);
    expect(snapshot.meta.status).toBe("stale");
  });
});
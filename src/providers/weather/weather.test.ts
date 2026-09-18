import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildWeatherUrl,
  mapWeatherResponse,
  fetchWeatherSnapshot,
  WeatherError,
} from "./openMeteoWeather";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildWeatherUrl", () => {
  it("includes coordinates, wind params, visibility, cloud cover", () => {
    const url = buildWeatherUrl(-29.9, -71.25);
    expect(url).toContain("latitude=-29.9");
    expect(url).toContain("longitude=-71.25");
    expect(url).toContain("wind_speed_unit=kmh");
    expect(url).toContain("wind_speed_10m");
    expect(url).toContain("wind_speed_100m");
    expect(url).toContain("wind_direction_100m");
    expect(url).toContain("visibility");
    expect(url).toContain("cloud_cover");
    expect(url).toContain("timezone=auto");
  });

  it("propagates the timezone from the operation coordinate when provided", () => {
    const url = buildWeatherUrl(-27.15, -109.43, "Pacific/Easter");
    expect(url).toContain("timezone=Pacific%2FEaster");
  });
});

describe("mapWeatherResponse", () => {
  const payload = {
    current: {
      time: "2026-08-26T11:00",
      temperature_2m: 13.2,
      relative_humidity_2m: 82,
      precipitation: 0.3,
      weather_code: 61,
      wind_speed_10m: 13,
      wind_direction_10m: 330,
      wind_gusts_10m: 20,
      visibility: 8000,
      cloud_cover: 45,
    },
    hourly: {
      time: ["2026-08-26T10:00", "2026-08-26T11:00"],
      temperature_2m: [11.5, 13.2],
      relative_humidity_2m: [85, 82],
      precipitation: [0.1, 0.3],
      weather_code: [3, 61],
      wind_speed_10m: [10, 13],
      wind_gusts_10m: [16, 20],
      wind_direction_10m: [325, 330],
      wind_speed_100m: [22, 24.5],
      wind_direction_100m: [340, 345],
      visibility: [9000, 8000],
      cloud_cover: [40, 45],
    },
  };

  it("maps current fields correctly", () => {
    const snapshot = mapWeatherResponse(payload);
    expect(snapshot.current.temperatureC).toBe(13.2);
    expect(snapshot.current.windSpeedKmh).toBe(13);
    expect(snapshot.current.windDirectionDeg).toBe(330);
    expect(snapshot.current.windGustsKmh).toBe(20);
    expect(snapshot.current.visibilityM).toBe(8000);
    expect(snapshot.current.cloudCoverPct).toBe(45);
    expect(snapshot.current.weatherCode).toBe(61);
    expect(snapshot.current.humidityPct).toBe(82);
    expect(snapshot.current.precipitationMm).toBe(0.3);
  });

  it("maps hourly wind 100m", () => {
    const snapshot = mapWeatherResponse(payload);
    expect(snapshot.hourly).toHaveLength(2);
    expect(snapshot.hourly[0].windSpeed100mKmh).toBe(22);
    expect(snapshot.hourly[1].windDirection100mDeg).toBe(345);
  });

  it("maps expanded hourly fields", () => {
    const snapshot = mapWeatherResponse(payload);
    const first = snapshot.hourly[0];
    expect(first.timeISO).toBe("2026-08-26T10:00");
    expect(first.temperatureC).toBe(11.5);
    expect(first.humidityPct).toBe(85);
    expect(first.precipitationMm).toBe(0.1);
    expect(first.weatherCode).toBe(3);
    expect(first.windSpeedKmh).toBe(10);
    expect(first.windGustsKmh).toBe(16);
    expect(first.windDirectionDeg).toBe(325);
    expect(first.visibilityM).toBe(9000);
    expect(first.cloudCoverPct).toBe(40);
  });

  it("handles missing hourly data", () => {
    const snapshot = mapWeatherResponse({ current: payload.current });
    expect(snapshot.hourly).toHaveLength(0);
  });

  it("defaults missing hourly series to null without throwing", () => {
    const snapshot = mapWeatherResponse({
      current: payload.current,
      hourly: { time: ["2026-08-26T10:00"], wind_speed_100m: [22] },
    });
    expect(snapshot.hourly[0].windSpeed100mKmh).toBe(22);
    expect(snapshot.hourly[0].temperatureC).toBeNull();
    expect(snapshot.hourly[0].weatherCode).toBeNull();
  });

  it("fails with invalid-input for out-of-range coordinates", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchWeatherSnapshot(999, 0)).rejects.toMatchObject({
      kind: "invalid-input",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails with invalid-response on a bad JSON body", async () => {
    const badJson = {
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(badJson));
    await expect(fetchWeatherSnapshot(-33.45, -70.66)).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("fails with invalid-response on an incomplete payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response)
    );
    await expect(fetchWeatherSnapshot(-33.45, -70.66)).rejects.toBeInstanceOf(
      WeatherError
    );
  });

  it("fails with offline on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(fetchWeatherSnapshot(-33.45, -70.66)).rejects.toMatchObject({
      kind: "offline",
    });
  });

  it("fails with timeout when the request is aborted", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(fetchWeatherSnapshot(-33.45, -70.66)).rejects.toMatchObject({
      kind: "timeout",
    });
  });

  it("derives freshness from the dataset time and exposes timezone", async () => {
    const utcOffsetSeconds = -10800;
    const nowIso = new Date(Date.now() + utcOffsetSeconds * 1000)
      .toISOString()
      .slice(0, 16);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          current: {
            time: nowIso,
            temperature_2m: 10,
            relative_humidity_2m: 50,
            precipitation: 0,
            weather_code: 0,
            wind_speed_10m: 5,
            wind_gusts_10m: 8,
            wind_direction_10m: 180,
            visibility: 10000,
            cloud_cover: 10,
          },
          timezone: "America/Santiago",
          timezone_abbreviation: "-03",
          utc_offset_seconds: utcOffsetSeconds,
        }),
      } as unknown as Response)
    );
    const snapshot = await fetchWeatherSnapshot(-33.45, -70.66);
    expect(snapshot.meta.status).toBe("updated");
    expect(snapshot.meta.dataTime).toBe(nowIso);
    expect(snapshot.timezone).toBe("America/Santiago");
    expect(snapshot.utcOffsetSeconds).toBe(utcOffsetSeconds);
  });

  it("marks an old cached dataset as stale even if just received", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          current: { ...payload.current, time: "2026-08-26T11:00" },
        }),
      } as unknown as Response)
    );
    const snapshot = await fetchWeatherSnapshot(-33.45, -70.66);
    expect(snapshot.meta.status).toBe("stale");
  });

  it("handles null values in current", () => {
    const sparse = {
      current: {
        time: "2026-08-26T11:00",
        temperature_2m: null,
        relative_humidity_2m: null,
        precipitation: null,
        weather_code: 0,
        wind_speed_10m: null,
        wind_direction_10m: null,
        wind_gusts_10m: null,
        visibility: null,
        cloud_cover: null,
      },
    };
    const snapshot = mapWeatherResponse(sparse);
    expect(snapshot.current.temperatureC).toBeNull();
    expect(snapshot.current.windSpeedKmh).toBeNull();
    expect(snapshot.current.visibilityM).toBeNull();
  });
});

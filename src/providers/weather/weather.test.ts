import { describe, expect, it } from "vitest";
import { buildWeatherUrl, mapWeatherResponse } from "./openMeteoWeather";

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
    expect(url).toContain("timezone=America");
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

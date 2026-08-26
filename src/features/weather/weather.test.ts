import { describe, expect, it } from "vitest";
import type { WeatherSnapshot } from "./weather.types";
import {
  buildForecastUrl,
  mapOpenMeteoToSnapshot,
  nearestHourlyIndex,
} from "./weather.service";

describe("nearestHourlyIndex", () => {
  const times = ["2026-08-26T10:00", "2026-08-26T11:00", "2026-08-26T12:00"];

  it("encuentra coincidencia exacta", () => {
    expect(nearestHourlyIndex(times, "2026-08-26T11:00")).toBe(1);
  });

  it("usa la hora anterior cuando no hay coincidencia exacta", () => {
    expect(nearestHourlyIndex(times, "2026-08-26T11:30")).toBe(1);
  });

  it("retorna 0 si la hora actual es anterior a todas", () => {
    expect(nearestHourlyIndex(times, "2026-08-26T09:00")).toBe(0);
  });

  it("retorna -1 con lista vacía", () => {
    expect(nearestHourlyIndex([], "2026-08-26T10:00")).toBe(-1);
  });
});

describe("buildForecastUrl", () => {
  it("incluye coordenadas y parámetros clave", () => {
    const url = buildForecastUrl({ latitude: -29.9, longitude: -71.25 });
    expect(url).toContain("latitude=-29.9");
    expect(url).toContain("longitude=-71.25");
    expect(url).toContain("wind_speed_unit=kmh");
    expect(url).toContain("timezone=auto");
    expect(url).toContain("hourly=wind_speed_100m");
  });
});

describe("mapOpenMeteoToSnapshot", () => {
  const coord = { latitude: -29.9, longitude: -71.25 };
  const fetchedAt = "2026-08-26T14:00:00.000Z";

  const fullPayload = {
    timezone: "America/Santiago",
    current: {
      time: "2026-08-26T11:00",
      temperature_2m: 13.2,
      apparent_temperature: 12.1,
      relative_humidity_2m: 82,
      precipitation: 0.3,
      weather_code: 61,
      wind_speed_10m: 13,
      wind_direction_10m: 330,
      wind_gusts_10m: 20,
    },
    hourly: {
      time: ["2026-08-26T11:00"],
      wind_speed_100m: [24.5],
    },
    daily: {
      sunrise: ["2026-08-26T07:12"],
      sunset: ["2026-08-26T18:20"],
    },
  };

  it("mapea un payload completo con estado OK", () => {
    const snapshot: WeatherSnapshot = mapOpenMeteoToSnapshot(
      fullPayload,
      coord,
      fetchedAt,
    );
    expect(snapshot.status).toBe("OK");
    expect(snapshot.current.temperatureC).toBe(13.2);
    expect(snapshot.current.windSpeedKmh).toBe(13);
    expect(snapshot.current.windDirectionDeg).toBe(330);
    expect(snapshot.windSpeed100mKmh).toBe(24.5);
    expect(snapshot.sun.sunriseLocal).toBe("2026-08-26T07:12");
    expect(snapshot.timezone).toBe("America/Santiago");
    expect(snapshot.fetchedAtIso).toBe(fetchedAt);
  });

  it("marca PARTIAL si falta el viento a 100 m", () => {
    const partialPayload = {
      ...fullPayload,
      hourly: undefined,
    };
    const snapshot = mapOpenMeteoToSnapshot(partialPayload, coord, fetchedAt);
    expect(snapshot.status).toBe("PARTIAL");
    expect(snapshot.windSpeed100mKmh).toBeNull();
  });

  it("lanza WEATHER_INVALID_RESPONSE sin bloque current", () => {
    expect(() =>
      mapOpenMeteoToSnapshot({ timezone: "x" }, coord, fetchedAt),
    ).toThrowError(/Respuesta inválida/);
  });
});

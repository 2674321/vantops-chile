import { describe, expect, it } from "vitest";
import type { WeatherSnapshot } from "../weather";
import {
  captureAssessmentSnapshot,
  captureObservationSnapshot,
  captureWeatherSnapshot,
} from "./snapshots";

const capturedAt = "2026-11-14T12:00:00Z";

describe("flight plan snapshots", () => {
  it("keeps weather provenance and an immutable value copy", () => {
    const weather: WeatherSnapshot = {
      current: {
        timeISO: "2026-11-14T09:00",
        temperatureC: 20,
        humidityPct: 50,
        precipitationMm: 0,
        weatherCode: 1,
        windSpeedKmh: 12,
        windGustsKmh: 18,
        windDirectionDeg: 180,
        windSpeed100mKmh: 25,
        windDirection100mDeg: 190,
        visibilityM: 10000,
        cloudCoverPct: 20,
      },
      hourly: [],
      meta: {
        source: "Open-Meteo",
        requestedAt: capturedAt,
        receivedAt: capturedAt,
        dataTime: "2026-11-14T09:00",
        status: "updated",
      },
    };
    const record = captureWeatherSnapshot(weather, capturedAt);
    weather.current.windSpeedKmh = 99;
    expect(record.current.windSpeedKmh).toBe(12);
    expect(record).toMatchObject({
      capturedAt,
      source: "Open-Meteo",
      dataTime: "2026-11-14T09:00",
      sourceStatus: "updated",
    });
  });

  it("keeps assessment completeness and the exact limits", () => {
    const record = captureAssessmentSnapshot(
      {
        status: "CAUTION",
        reasons: [{ code: "GUST_MISSING", severity: "warning", message: "Sin ráfagas" }],
        evaluatedAt: capturedAt,
        missingData: ["ráfagas"],
        blockingMissingData: ["ráfagas"],
        informationalMissingData: [],
        isComplete: false,
        hasConfiguredLimits: true,
      },
      { gustMaxKmh: 30, windReferenceHeight: 100 },
      capturedAt
    );
    expect(record.isComplete).toBe(false);
    expect(record.blockingMissingData).toEqual(["ráfagas"]);
    expect(record.flightLimitsSnapshot).toEqual({
      gustMaxKmh: 30,
      windReferenceHeight: 100,
    });
  });

  it("keeps METAR community source and observation time", () => {
    const record = captureObservationSnapshot(
      {
        stationIcao: "SCEL",
        stationName: "Santiago",
        distanceKm: 12,
        observation: {
          station: "SCEL",
          observedAtISO: "2026-11-14T11:00:00Z",
          observedAtLocal: "08:00",
          windDirDeg: 180,
          windKmh: 10,
          gustKmh: null,
          visibilityM: 10000,
          visibilityLabel: "10 km o más",
          tempC: 20,
          dewC: 10,
          qnhHpa: 1013,
          clouds: [],
          phenomena: [],
          raw: "SCEL 141100Z 18005KT CAVOK 20/10 Q1013",
        },
        meta: {
          source: "VATSIM METAR",
          requestedAt: capturedAt,
          receivedAt: capturedAt,
          dataTime: "2026-11-14T11:00:00Z",
          status: "updated",
        },
      },
      capturedAt
    );
    expect(record).toMatchObject({
      stationIcao: "SCEL",
      observedAt: "2026-11-14T11:00:00Z",
      source: "VATSIM METAR",
      sourceStatus: "updated",
    });
  });
});

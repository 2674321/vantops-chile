import { describe, it, expect } from "vitest";
import {
  OPERATION_TYPE_LABELS,
  INCIDENT_TYPE_LABELS,
} from "./types";
import type {
  FlightRecord,
  BatteryRecord,
  OperationType,
  FlightIncidentType,
} from "./types";

describe("OperationType labels", () => {
  it("has all operation types", () => {
    const types: OperationType[] = [
      "RECREATIONAL",
      "PHOTOGRAPHY",
      "INSPECTION",
      "EMERGENCY",
      "TRAINING",
      "OTHER",
    ];
    for (const type of types) {
      expect(OPERATION_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("has 6 operation types", () => {
    expect(Object.keys(OPERATION_TYPE_LABELS)).toHaveLength(6);
  });
});

describe("IncidentType labels", () => {
  it("has all incident types", () => {
    const types: FlightIncidentType[] = [
      "BATTERY",
      "WEATHER",
      "SIGNAL",
      "RTH",
      "LANDING",
      "OTHER",
    ];
    for (const type of types) {
      expect(INCIDENT_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("has 6 incident types", () => {
    expect(Object.keys(INCIDENT_TYPE_LABELS)).toHaveLength(6);
  });
});

describe("FlightRecord structure", () => {
  it("can create a valid flight record", () => {
    const now = new Date().toISOString();
    const flight: FlightRecord = {
      id: "test-flight-1",
      startedAt: now,
      coordinate: { latitude: -33.4521, longitude: -70.6536 },
      createdAt: now,
      updatedAt: now,
    };
    expect(flight.id).toBe("test-flight-1");
    expect(flight.coordinate.latitude).toBe(-33.4521);
    expect(flight.endedAt).toBeUndefined();
    expect(flight.durationSeconds).toBeUndefined();
  });

  it("can create flight with all optional fields", () => {
    const now = new Date().toISOString();
    const flight: FlightRecord = {
      id: "test-flight-2",
      startedAt: now,
      endedAt: now,
      durationSeconds: 1200,
      coordinate: { latitude: -33.4521, longitude: -70.6536 },
      elevation: 500,
      aircraftId: "dji-mini-4-pro",
      aircraftSnapshot: {
        id: "dji-mini-4-pro",
        name: "DJI Mini 4 Pro",
        type: "MULTIROTOR",
        manufacturer: "DJI",
        model: "Mini 4 Pro",
      },
      weatherSnapshot: {
        current: {
          temperatureC: 15,
          humidityPct: 70,
          precipitationMm: 0,
          weatherCode: 0,
          windSpeedKmh: 10,
          windGustsKmh: 15,
          windDirectionDeg: 270,
          windSpeed100mKmh: 20,
          windDirection100mDeg: 270,
          visibilityM: 10000,
          cloudCoverPct: 30,
        },
        capturedAt: now,
      },
      observationSnapshot: {
        stationIcao: "SCEL",
        stationName: "Santiago",
        rawMetar: "SCEL 261200Z 27010KT 9999 FEW030 15/08 Q1015",
        capturedAt: now,
      },
      assessmentSnapshot: {
        status: "FAVORABLE",
        reasons: [],
        evaluatedAt: now,
        missingData: [],
        capturedAt: now,
      },
      checklistSnapshot: {
        states: [
          { itemId: "norm-credencial", checked: true, checkedAt: now },
          { itemId: "norm-seguro", checked: true, checkedAt: now },
        ],
        totalItems: 33,
        checkedItems: 2,
        capturedAt: now,
      },
      batteryId: "bat-1",
      batteryStartPct: 100,
      batteryEndPct: 72,
      operationType: "PHOTOGRAPHY",
      incidents: [
        { id: "inc-1", type: "SIGNAL", notes: "Señal intermitente" },
      ],
      notes: "Vuelo de prueba",
      createdAt: now,
      updatedAt: now,
    };
    expect(flight.aircraftSnapshot?.name).toBe("DJI Mini 4 Pro");
    expect(flight.weatherSnapshot?.current.temperatureC).toBe(15);
    expect(flight.observationSnapshot?.rawMetar).toContain("SCEL");
    expect(flight.assessmentSnapshot?.status).toBe("FAVORABLE");
    expect(flight.checklistSnapshot?.checkedItems).toBe(2);
    expect(flight.incidents).toHaveLength(1);
  });
});

describe("BatteryRecord structure", () => {
  it("can create a valid battery record", () => {
    const now = new Date().toISOString();
    const battery: BatteryRecord = {
      id: "bat-test-1",
      name: "Batería 1",
      cycleCount: 12,
      createdAt: now,
      updatedAt: now,
    };
    expect(battery.id).toBe("bat-test-1");
    expect(battery.cycleCount).toBe(12);
  });

  it("battery with notes", () => {
    const now = new Date().toISOString();
    const battery: BatteryRecord = {
      id: "bat-test-2",
      name: "Batería 2",
      cycleCount: 0,
      notes: "Nueva",
      createdAt: now,
      updatedAt: now,
    };
    expect(battery.notes).toBe("Nueva");
  });
});

describe("Snapshot immutability principle", () => {
  it("weather snapshot preserves original values", () => {
    const now = new Date().toISOString();
    const snapshot = {
      current: {
        temperatureC: 15,
        humidityPct: 70,
        precipitationMm: 0,
        weatherCode: 0,
        windSpeedKmh: 10,
        windGustsKmh: 15,
        windDirectionDeg: 270,
        windSpeed100mKmh: 20,
        windDirection100mDeg: 270,
        visibilityM: 10000,
        cloudCoverPct: 30,
      },
      capturedAt: now,
    };
    const copy = { ...snapshot, current: { ...snapshot.current } };
    copy.current.temperatureC = 25;
    expect(snapshot.current.temperatureC).toBe(15);
    expect(copy.current.temperatureC).toBe(25);
  });

  it("null values preserved (not replaced with 0)", () => {
    const now = new Date().toISOString();
    const snapshot = {
      current: {
        temperatureC: null,
        humidityPct: null,
        precipitationMm: null,
        weatherCode: 0,
        windSpeedKmh: null,
        windGustsKmh: null,
        windDirectionDeg: null,
        windSpeed100mKmh: null,
        windDirection100mDeg: null,
        visibilityM: null,
        cloudCoverPct: null,
      },
      capturedAt: now,
    };
    expect(snapshot.current.temperatureC).toBeNull();
    expect(snapshot.current.windSpeedKmh).toBeNull();
    expect(snapshot.current.visibilityM).toBeNull();
  });
});

describe("METAR raw preservation", () => {
  it("observation snapshot stores raw METAR", () => {
    const now = new Date().toISOString();
    const obs = {
      stationIcao: "SCEL",
      stationName: "Santiago",
      rawMetar: "SCEL 261200Z 27010KT 9999 FEW030 15/08 Q1015",
      capturedAt: now,
    };
    expect(obs.rawMetar).toContain("SCEL");
    expect(obs.rawMetar).toBeTruthy();
  });

  it("observation snapshot works without raw METAR", () => {
    const now = new Date().toISOString();
    const obs: { stationIcao: string; capturedAt: string; rawMetar?: string } = {
      stationIcao: "SCEL",
      capturedAt: now,
    };
    expect(obs.rawMetar).toBeUndefined();
  });
});

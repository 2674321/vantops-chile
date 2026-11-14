// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import type { FlightAssessment } from "../../domain/assessment/types";
import type { WeatherSnapshot } from "../../domain/weather";
import { AssessmentCard } from "./AssessmentCard";

const snapshot: WeatherSnapshot = {
  current: {
    timeISO: "2026-11-14T12:00:00Z",
    temperatureC: 20,
    humidityPct: 50,
    precipitationMm: 0,
    weatherCode: 0,
    windSpeedKmh: 12,
    windGustsKmh: 18,
    windDirectionDeg: 180,
    windSpeed100mKmh: 20,
    windDirection100mDeg: 190,
    visibilityM: 10_000,
    cloudCoverPct: 10,
  },
  hourly: [],
  meta: {
    source: "fixture",
    requestedAt: "2026-11-14T12:00:00Z",
    receivedAt: "2026-11-14T12:00:01Z",
    dataTime: "2026-11-14T12:00:00Z",
    status: "updated",
  },
};

const assessment: FlightAssessment = {
  status: "CAUTION",
  reasons: [
    { code: "WIND_NEAR_LIMIT", severity: "warning", message: "Viento cercano al límite" },
    { code: "WIND_VALUE", severity: "info", message: "Viento evaluado: 12 km/h" },
  ],
  evaluatedAt: "2026-11-14T12:00:02Z",
  missingData: [],
  blockingMissingData: [],
  informationalMissingData: [],
  isComplete: true,
  hasConfiguredLimits: true,
};

afterEach(cleanup);

describe("AssessmentCard presentation modes", () => {
  it("keeps the same domain result and only adds evidence in expert mode", () => {
    const { rerender } = render(
      <AssessmentCard snapshot={snapshot} assessment={assessment} />
    );

    expect(screen.getByText("Revisión necesaria")).toBeInTheDocument();
    expect(screen.getByText("Viento cercano al límite")).toBeInTheDocument();
    expect(screen.queryByText("Viento evaluado: 12 km/h")).not.toBeInTheDocument();

    rerender(
      <AssessmentCard snapshot={snapshot} assessment={assessment} expertMode />
    );

    expect(screen.getByText("Revisión necesaria")).toBeInTheDocument();
    expect(screen.getByText("Viento cercano al límite")).toBeInTheDocument();
    expect(screen.getByText("Viento evaluado: 12 km/h")).toBeInTheDocument();
    expect(screen.getByText(/tiempo UTC de evaluación/)).toBeInTheDocument();
  });
});

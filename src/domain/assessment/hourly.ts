import type { HourlyWeather } from "../weather";
import type { FlightLimits } from "./limits";
import type { FlightAssessment, FlightAssessmentInput } from "./types";
import { evaluateFlight } from "./evaluator";

export interface HourlyAssessment {
  timeISO: string;
  assessment: FlightAssessment;
}

export function assessmentInputFromHourly(
  hour: HourlyWeather,
  limits: FlightLimits,
  sourceStatus?: FlightAssessmentInput["sourceStatus"]
): FlightAssessmentInput {
  const useWind100m = limits.windReferenceHeight === 100;
  const windSpeedKmh = useWind100m ? hour.windSpeed100mKmh : hour.windSpeedKmh;
  return {
    windSpeedKmh,
    gustKmh: hour.windGustsKmh,
    windSpeed100mKmh: hour.windSpeed100mKmh,
    windDirectionDeg: hour.windDirectionDeg,
    temperatureC: hour.temperatureC,
    precipitationMm: hour.precipitationMm,
    visibilityM: hour.visibilityM,
    humidityPct: hour.humidityPct,
    cloudCoverPct: hour.cloudCoverPct,
    windMaxKmh: limits.windMaxKmh,
    gustMaxKmh: limits.gustMaxKmh,
    precipitationMaxMm: limits.precipitationMaxMm,
    visibilityMinMeters: limits.visibilityMinMeters,
    temperatureMinC: limits.temperatureMinC,
    temperatureMaxC: limits.temperatureMaxC,
    sourceStatus,
  };
}

export function evaluateHour(
  hour: HourlyWeather,
  limits: FlightLimits,
  sourceStatus?: FlightAssessmentInput["sourceStatus"]
): FlightAssessment {
  return evaluateFlight(assessmentInputFromHourly(hour, limits, sourceStatus));
}

export function assessHourlyForecast(
  hours: HourlyWeather[],
  limits: FlightLimits,
  sourceStatus?: FlightAssessmentInput["sourceStatus"]
): HourlyAssessment[] {
  return hours.map((hour) => ({
    timeISO: hour.timeISO,
    assessment: evaluateHour(hour, limits, sourceStatus),
  }));
}

import type {
  FlightAssessmentInput,
  FlightAssessment,
  AssessmentStatus,
  AssessmentReason,
} from "./types";
import {
  evaluateWind,
  evaluateGust,
  evaluatePrecipitation,
  evaluateVisibility,
  evaluateTemperature,
  evaluateWind100m,
} from "./rules";

export function evaluateFlight(
  input: FlightAssessmentInput
): FlightAssessment {
  const reasons: AssessmentReason[] = [];
  const missingData: string[] = [];

  const wind = evaluateWind(input);
  if (wind) reasons.push(wind);

  const gust = evaluateGust(input);
  if (gust) reasons.push(gust);

  const precip = evaluatePrecipitation(input);
  if (precip) reasons.push(precip);

  const vis = evaluateVisibility(input);
  if (vis) reasons.push(vis);

  const temp = evaluateTemperature(input);
  if (temp) reasons.push(temp);

  const wind100 = evaluateWind100m(input);
  if (wind100) reasons.push(wind100);

  if (input.windSpeedKmh == null) missingData.push("viento 10 m");
  if (input.gustKmh == null) missingData.push("ráfagas");
  if (input.visibilityM == null) missingData.push("visibilidad");
  if (input.temperatureC == null) missingData.push("temperatura");
  if (input.precipitationMm == null) missingData.push("precipitación");

  const hasLimits =
    input.windMaxKmh != null ||
    input.gustMaxKmh != null ||
    input.precipitationMaxMm != null ||
    input.visibilityMinMeters != null ||
    input.temperatureMinC != null ||
    input.temperatureMaxC != null;

  const status = determineStatus(reasons, hasLimits);

  return {
    status,
    reasons,
    evaluatedAt: new Date().toISOString(),
    missingData,
  };
}

function determineStatus(
  reasons: AssessmentReason[],
  hasLimits: boolean
): AssessmentStatus {
  if (!hasLimits) return "NO_DATA";

  const hasCritical = reasons.some((r) => r.severity === "critical");
  if (hasCritical) return "UNFAVORABLE";

  const hasWarning = reasons.some((r) => r.severity === "warning");
  if (hasWarning) return "CAUTION";

  return "FAVORABLE";
}

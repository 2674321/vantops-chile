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
  const blockingMissingData: string[] = [];
  const informationalMissingData: string[] = [];

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

  classifyMissing(input.windSpeedKmh, "viento de referencia", input.windMaxKmh != null);
  classifyMissing(input.gustKmh, "ráfagas", input.gustMaxKmh != null);
  classifyMissing(input.visibilityM, "visibilidad", input.visibilityMinMeters != null);
  classifyMissing(
    input.temperatureC,
    "temperatura",
    input.temperatureMinC != null || input.temperatureMaxC != null
  );
  classifyMissing(
    input.precipitationMm,
    "precipitación",
    input.precipitationMaxMm != null
  );

  function classifyMissing(
    value: number | null | undefined,
    label: string,
    required: boolean
  ) {
    if (typeof value === "number" && Number.isFinite(value)) return;
    missingData.push(label);
    (required ? blockingMissingData : informationalMissingData).push(label);
  }

  const hasLimits =
    input.windMaxKmh != null ||
    input.gustMaxKmh != null ||
    input.precipitationMaxMm != null ||
    input.visibilityMinMeters != null ||
    input.temperatureMinC != null ||
    input.temperatureMaxC != null;

  if (reasons.some((reason) => reason.code.endsWith("LIMIT_INVALID"))) {
    blockingMissingData.push("configuración de límites válida");
  }

  if (hasLimits && input.sourceStatus && input.sourceStatus !== "updated") {
    const sourceLabel =
      input.sourceStatus === "stale"
        ? "Los datos meteorológicos están vencidos"
        : "No se pudo comprobar la vigencia de los datos meteorológicos";
    reasons.push({
      code: `SOURCE_${input.sourceStatus.toUpperCase().replace("-", "_")}`,
      severity: "warning",
      message: `${sourceLabel}; actualiza la fuente antes de interpretar el resultado como actual`,
      source: "Open-Meteo",
    });
    blockingMissingData.push("vigencia de la fuente");
  }

  const status = determineStatus(reasons, hasLimits, blockingMissingData.length > 0);

  return {
    status,
    reasons,
    evaluatedAt: new Date().toISOString(),
    missingData,
    blockingMissingData,
    informationalMissingData,
    isComplete: hasLimits && blockingMissingData.length === 0,
    hasConfiguredLimits: hasLimits,
  };
}

function determineStatus(
  reasons: AssessmentReason[],
  hasLimits: boolean,
  hasBlockingMissingData: boolean
): AssessmentStatus {
  if (!hasLimits) return "NO_DATA";

  const hasCritical = reasons.some((r) => r.severity === "critical");
  if (hasCritical) return "UNFAVORABLE";

  const hasWarning = reasons.some((r) => r.severity === "warning");
  if (hasWarning) return "CAUTION";

  if (hasBlockingMissingData) return "CAUTION";

  return "FAVORABLE";
}
